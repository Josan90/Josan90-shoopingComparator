import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const userEmail = process.env.DEFAULT_USER_EMAIL || "demo@local.dev";
  const userPassword = process.env.DEFAULT_USER_PASSWORD || "demo12345";
  const passwordHash = await bcrypt.hash(userPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      passwordHash
    },
    create: {
      email: userEmail,
      name: "Demo",
      passwordHash
    }
  });

  const stores = await Promise.all(
    [
      { name: "Mercadona", website: "https://www.mercadona.es" },
      { name: "Carrefour", website: "https://www.carrefour.es" },
      { name: "DIA", website: "https://www.dia.es" }
    ].map(async (store) => {
      const existing = await prisma.store.findFirst({
        where: { userId: user.id, name: store.name },
        select: { id: true }
      });

      if (existing) {
        return prisma.store.update({
          where: { id: existing.id },
          data: store
        });
      }

      return prisma.store.create({
        data: {
          userId: user.id,
          ...store
        }
      });
    })
  );

  const baseProducts = [
    {
      name: "Arroz redondo",
      brand: "SOS",
      category: "Despensa",
      extraInfo: "Paquete 1kg"
    },
    {
      name: "Leche entera",
      brand: "Pascual",
      category: "Lacteos",
      extraInfo: "Brik 1L"
    },
    {
      name: "Aceite de oliva virgen extra",
      brand: "Carbonell",
      category: "Despensa",
      extraInfo: "Botella 1L"
    },
    {
      name: "Pechuga de pollo",
      brand: null,
      category: "Carniceria",
      extraInfo: "Bandeja aproximada 500g"
    }
  ];

  const products = await Promise.all(
    baseProducts.map(async (product) => {
      const existing = await prisma.product.findFirst({
        where: {
          userId: user.id,
          name: product.name,
          brand: product.brand,
          category: product.category
        }
      });

      if (existing && !existing.extraInfo && product.extraInfo) {
        return prisma.product.update({
          where: { id: existing.id },
          data: { extraInfo: product.extraInfo }
        });
      }
      if (existing) return existing;
      return prisma.product.create({
        data: {
          userId: user.id,
          ...product
        }
      });
    })
  );

  const snapshots: Array<{
    productId: number;
    storeId: number;
    price: Prisma.Decimal;
    unitValue: Prisma.Decimal;
    unitType: string;
    pricePerRef: Prisma.Decimal;
  }> = [];

  for (const product of products) {
    for (const store of stores) {
      const base = Math.random() * 5 + 1;
      const price = new Prisma.Decimal(base.toFixed(2));
      const unitValue = new Prisma.Decimal(1);
      snapshots.push({
        productId: product.id,
        storeId: store.id,
        price,
        unitValue,
        unitType: "kg",
        pricePerRef: price.div(unitValue)
      });
    }
  }

  await prisma.priceSnapshot.createMany({ data: snapshots });

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId: products[0].id
      }
    },
    update: {},
    create: {
      userId: user.id,
      productId: products[0].id
    }
  });

  console.log("Seed completado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
