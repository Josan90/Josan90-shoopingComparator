import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { getDefaultUser, getFavoriteProductIds, getProductsComparison } from "@/lib/data";

export default async function FavoritesPage() {
  const user = await getDefaultUser();
  if (!user) {
    return <p>No hay usuario por defecto configurado.</p>;
  }

  const [products, favoriteIds] = await Promise.all([
    getProductsComparison(),
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
