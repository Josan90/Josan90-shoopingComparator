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

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function getProductsComparison(userId: number, search?: string): Promise<ProductComparison[]> {
  const normalizedSearch = search ? normalizeSearchValue(search) : "";
  const products = await prisma.product.findMany({
    where: {
      userId
    },
    include: {
      snapshots: {
        include: { store: true },
        orderBy: { capturedAt: "desc" }
      }
    },
    orderBy: { name: "asc" }
  });

  const filteredProducts = normalizedSearch
    ? products.filter((product) =>
        [product.name, product.brand, product.category, product.extraInfo]
          .filter((value): value is string => Boolean(value))
          .some((value) => normalizeSearchValue(value).includes(normalizedSearch))
      )
    : products;

  return filteredProducts.map((product) => {
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
    where: {
      userId,
      product: { userId }
    },
    select: { productId: true }
  });

  return favorites.map((fav) => fav.productId);
}

export async function getStores(userId: number) {
  return prisma.store.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, website: true }
  });
}
