import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { PaginationControls } from "@/components/pagination-controls";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteProductIds, getProductsComparison } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 12;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function FavoritesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="panel">
        <h2>Mis favoritos</h2>
        <p className="muted">
          Necesitas iniciar sesión para ver y gestionar favoritos. Puedes <Link href="/login">entrar</Link> o{" "}
          <Link href="/register">crear cuenta</Link>.
        </p>
      </section>
    );
  }

  const [products, favoriteIds] = await Promise.all([
    getProductsComparison(user.id),
    getFavoriteProductIds(user.id)
  ]);

  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.productId));
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const totalPages = Math.max(1, Math.ceil(favoriteProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFavorites = favoriteProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section>
      <h2>Mis favoritos</h2>
      {favoriteProducts.length === 0 ? (
        <p>
          No tienes favoritos todavia. Ve al <Link href="/">comparador</Link> para guardar productos.
        </p>
      ) : (
        <>
          <div className="results-toolbar">
            <p className="muted">
              Mostrando {paginatedFavorites.length} de {favoriteProducts.length} favoritos.
            </p>
            <PaginationControls page={safePage} pathname="/favorites" totalPages={totalPages} />
          </div>

          <div className="cards">
            {paginatedFavorites.map((product) => (
              <article className="card" key={product.productId}>
                <h3>{product.productName}</h3>
                <p className="muted">{product.brand || "Sin marca"}</p>
                {product.extraInfo ? <p className="muted">{product.extraInfo}</p> : null}
                <p>
                  Mejor precio:{" "}
                  <strong>{product.bestPrice ? product.bestPrice.toFixed(2) : "-"}</strong>
                </p>
                <p>Tienda: {product.bestStore || "-"}</p>
                <FavoriteButton initiallyFavorite productId={product.productId} />
              </article>
            ))}
          </div>

          <PaginationControls page={safePage} pathname="/favorites" totalPages={totalPages} />
        </>
      )}
    </section>
  );
}
