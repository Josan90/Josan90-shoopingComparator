import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ProductOfferInput = {
  storeId: number;
  price: number;
};

type ProductBody = {
  name?: string;
  brand?: string;
  category?: string;
  extraInfo?: string;
  offers?: ProductOfferInput[];
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
  }

  const body = (await request.json()) as ProductBody;

  if (!body.name || body.name.trim().length < 2) {
    return NextResponse.json({ error: "El nombre del producto es obligatorio" }, { status: 400 });
  }

  const invalidOffer = (body.offers || []).find(
    (offer) => !offer.storeId || !offer.price || offer.price <= 0
  );
  if (invalidOffer) {
    return NextResponse.json({ error: "Hay precios invalidos" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: body.name!.trim(),
          brand: body.brand?.trim() || null,
          category: body.category?.trim() || null,
          extraInfo: body.extraInfo?.trim() || null
        }
      });

      if (body.offers && body.offers.length > 0) {
        await tx.priceSnapshot.createMany({
          data: body.offers.map((offer) => {
            const priceDecimal = new Prisma.Decimal(offer.price.toFixed(2));
            return {
              productId,
              storeId: offer.storeId,
              price: priceDecimal,
              unitType: "unit",
              unitValue: new Prisma.Decimal(1),
              pricePerRef: priceDecimal
            };
          })
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Producto invalido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id: productId } });
  return NextResponse.json({ ok: true });
}
