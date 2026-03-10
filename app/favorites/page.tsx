import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteProductIds, getProductsComparison } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
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

  return (
    <section>
      <h2>Mis favoritos</h2>
      {favoriteProducts.length === 0 ? (
        <p>
          No tienes favoritos todavia. Ve al <Link href="/">comparador</Link> para guardar productos.
        </p>
      ) : (
        <div className="cards">
          {favoriteProducts.map((product) => (
            <article className="card" key={product.productId}>
              <h3>{product.productName}</h3>
              <p className="muted">{product.brand || "Sin marca"}</p>
              {product.extraInfo ? <p className="muted">{product.extraInfo}</p> : null}
              <p>
                Mejor precio:{" "}
                <strong>{product.bestPrice ? `EUR ${product.bestPrice.toFixed(2)}` : "-"}</strong>
              </p>
              <p>Tienda: {product.bestStore || "-"}</p>
              <FavoriteButton initiallyFavorite productId={product.productId} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
