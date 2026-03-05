import { NextRequest, NextResponse } from "next/server";
import { getDefaultUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await getDefaultUser();
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const body = (await request.json()) as { productId?: number };
  if (!body.productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId: body.productId
      }
    },
    update: {},
    create: {
      userId: user.id,
      productId: body.productId
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getDefaultUser();
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const body = (await request.json()) as { productId?: number };
  if (!body.productId) {
    return NextResponse.json({ error: "productId es requerido" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: user.id,
      productId: body.productId
    }
  });

  return NextResponse.json({ ok: true });
}
