import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toISODate(input: Date): string {
  return input.toISOString().slice(0, 10);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days") || "30");
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 7), 180) : 30;

  const product = await prisma.product.findFirst({
    where: { id: productId, userId: user.id },
    select: { id: true, name: true }
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const from = new Date();
  from.setDate(from.getDate() - days);

  const snapshots = await prisma.priceSnapshot.findMany({
    where: {
      productId,
      capturedAt: { gte: from }
    },
    include: {
      store: {
        select: { id: true, name: true }
      }
    },
    orderBy: [{ capturedAt: "asc" }]
  });

  const byStore = new Map<
    number,
    {
      storeId: number;
      storeName: string;
      points: Array<{ date: string; price: number }>;
      lastByDate: Map<string, number>;
    }
  >();

  for (const s of snapshots) {
    if (!byStore.has(s.storeId)) {
      byStore.set(s.storeId, {
        storeId: s.storeId,
        storeName: s.store.name,
        points: [],
        lastByDate: new Map<string, number>()
      });
    }

    const entry = byStore.get(s.storeId)!;
    const day = toISODate(s.capturedAt);
    entry.lastByDate.set(day, Number(s.price));
  }

  const series = Array.from(byStore.values()).map((entry) => {
    const ordered = Array.from(entry.lastByDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, price]) => ({ date, price }));

    return {
      storeId: entry.storeId,
      storeName: entry.storeName,
      points: ordered
    };
  });

  return NextResponse.json({
    ok: true,
    product: {
      id: product.id,
      name: product.name
    },
    days,
    series
  });
}
