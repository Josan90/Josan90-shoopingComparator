import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type StoreBody = {
  name?: string;
  website?: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const storeId = Number(id);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return NextResponse.json({ error: "Supermercado invalido" }, { status: 400 });
  }

  const body = (await request.json()) as StoreBody;
  const name = body.name?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "El nombre del supermercado es obligatorio" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "Supermercado no encontrado" }, { status: 404 });
  }

  const duplicate = await prisma.store.findFirst({
    where: {
      name,
      id: { not: storeId }
    },
    select: { id: true }
  });

  if (duplicate) {
    return NextResponse.json({ error: "Ese supermercado ya existe" }, { status: 409 });
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      name,
      website: body.website?.trim() || null
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const storeId = Number(id);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return NextResponse.json({ error: "Supermercado invalido" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
  const linkedPrices = await prisma.priceSnapshot.count({ where: { storeId } });

  if (linkedPrices > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: este supermercado tiene precios historicos." },
      { status: 409 }
    );
  }
  if (!store) {
    return NextResponse.json({ error: "Supermercado no encontrado" }, { status: 404 });
  }

  await prisma.store.delete({ where: { id: storeId } });
  return NextResponse.json({ ok: true });
}
