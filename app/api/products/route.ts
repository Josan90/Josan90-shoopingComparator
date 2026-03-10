import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getUserFromRequest, unauthorizedResponse } from "@/lib/auth";
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

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as ProductBody;

  if (!body.name || body.name.trim().length < 2) {
    return NextResponse.json({ error: "El nombre del producto es obligatorio" }, { status: 400 });
  }

  if (!body.offers || body.offers.length === 0) {
    return NextResponse.json({ error: "Debes indicar al menos un precio" }, { status: 400 });
  }

  const invalidOffer = body.offers.find((offer) => !offer.storeId || !offer.price || offer.price <= 0);
  if (invalidOffer) {
    return NextResponse.json({ error: "Hay precios invalidos" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: body.name!.trim(),
          brand: body.brand?.trim() || null,
          category: body.category?.trim() || null,
          extraInfo: body.extraInfo?.trim() || null
        }
      });

      await tx.priceSnapshot.createMany({
        data: body.offers!.map((offer) => {
          const priceDecimal = new Prisma.Decimal(offer.price.toFixed(2));
          return {
            productId: product.id,
            storeId: offer.storeId,
            price: priceDecimal,
            unitType: "unit",
            unitValue: new Prisma.Decimal(1),
            pricePerRef: priceDecimal
          };
        })
      });

      return product;
    });

    return NextResponse.json({ ok: true, productId: result.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el producto. Revisa los supermercados seleccionados." },
      { status: 500 }
    );
  }
}
