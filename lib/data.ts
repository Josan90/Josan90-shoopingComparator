import { prisma } from "@/lib/prisma";

export type ProductComparison = {
  productId: number;
  productName: string;
  brand: string | null;
  category: string | null;
  extraInfo: string | null;
  bestPrice: number | null;
  bestStore: string | null;
  offers: Array<{
    storeId: number;
    storeName: string;
    price: number;
    pricePerRef: number | null;
    capturedAt: string;
  }>;
};

export async function getProductsComparison(search?: string): Promise<ProductComparison[]> {
  const products = await prisma.product.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { brand: { contains: search } },
            { category: { contains: search } }
          ]
        }
      : undefined,
    include: {
      snapshots: {
        include: { store: true },
        orderBy: { capturedAt: "desc" }
      }
    },
    orderBy: { name: "asc" }
  });

  return products.map((product) => {
    const latestByStore = new Map<number, (typeof product.snapshots)[number]>();

    for (const snapshot of product.snapshots) {
      if (!latestByStore.has(snapshot.storeId)) {
        latestByStore.set(snapshot.storeId, snapshot);
      }
    }

    const offers = Array.from(latestByStore.values()).map((snapshot) => ({
      storeId: snapshot.storeId,
      storeName: snapshot.store.name,
      price: Number(snapshot.price),
      pricePerRef: snapshot.pricePerRef ? Number(snapshot.pricePerRef) : null,
      capturedAt: snapshot.capturedAt.toISOString()
    }));

    offers.sort((a, b) => a.price - b.price);

    return {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      extraInfo: product.extraInfo,
      bestPrice: offers[0]?.price ?? null,
      bestStore: offers[0]?.storeName ?? null,
      offers
    };
  });
}

export async function getFavoriteProductIds(userId: number): Promise<number[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true }
  });

  return favorites.map((fav) => fav.productId);
}

export async function getStores() {
  return prisma.store.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, website: true }
  });
}
