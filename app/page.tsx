import { AddProductForm } from "@/components/add-product-form";
import { AddStoreForm } from "@/components/add-store-form";
import { DeleteProductButton } from "@/components/delete-product-button";
import { EditProductForm } from "@/components/edit-product-form";
import { FavoriteButton } from "@/components/favorite-button";
import { PriceHistoryModal } from "@/components/price-history-modal";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteProductIds, getProductsComparison, getStores } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim();

  const user = await getCurrentUser();
  const [products, stores, favoriteIds] = await Promise.all([
    getProductsComparison(query),
    getStores(),
    user ? getFavoriteProductIds(user.id) : Promise.resolve([])
  ]);

  return (
    <section className="page-stack">
      <div className="hero">
        <h2>Encuentra el mejor precio para cada producto</h2>
        <p>
          Compara supermercados, guarda favoritos y anade tus productos con los precios que veas en tienda.
        </p>
      </div>

      {user ? (
        <section className="forms-grid">
          <AddProductForm stores={stores} />
          <AddStoreForm stores={stores} />
        </section>
      ) : (
        <section className="panel">
          <p className="muted">
            Estás en modo lectura. Inicia sesión para guardar favoritos y gestionar productos o supermercados.
          </p>
        </section>
      )}

      <section className="panel">
        <form className="search-form" method="GET">
          <input
            defaultValue={query || ""}
            name="q"
            placeholder="Busca producto, marca o categoria"
            type="text"
          />
          <button className="btn-primary" type="submit">
            Buscar
          </button>
        </form>

        {products.length === 0 ? (
          <p className="empty-state">
            No hay productos cargados en la base de datos. Puedes anadir uno con el boton Nuevo producto.
          </p>
        ) : (
          <>
            <div className="mobile-cards">
              {products.map((product) => (
                <article className="result-card" key={product.productId}>
                  <div className="result-head">
                    <h3>{product.productName}</h3>
                    <div className="actions-cell">
                      {user ? (
                        <FavoriteButton
                          initiallyFavorite={favoriteIds.includes(product.productId)}
                          productId={product.productId}
                        />
                      ) : null}
                      <PriceHistoryModal productId={product.productId} productName={product.productName} />
                      {user ? <EditProductForm product={product} stores={stores} /> : null}
                      {user ? <DeleteProductButton productId={product.productId} /> : null}
                    </div>
                  </div>
                  <p className="muted">
                    {product.brand || "Sin marca"} | {product.category || "Sin categoria"}
                  </p>
                  {product.extraInfo ? <p className="muted">{product.extraInfo}</p> : null}
                  <p>
                    Mejor precio: <strong>{product.bestPrice ? `EUR ${product.bestPrice.toFixed(2)}` : "-"}</strong>
                  </p>
                  <p>
                    Tienda destacada: <span className="badge">{product.bestStore || "-"}</span>
                  </p>
                  <div className="offer-pills">
                    {product.offers.length === 0 ? (
                      <span className="offer-pill">Sin datos</span>
                    ) : (
                      product.offers.map((offer) => (
                        <span className="offer-pill" key={`${product.productId}-${offer.storeName}`}>
                          {offer.storeName}: EUR {offer.price.toFixed(2)}
                        </span>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="table-wrapper desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Mejor precio</th>
                    <th>Tienda</th>
                    {stores.map((store) => (
                      <th key={store.id}>{store.name}</th>
                    ))}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <strong>{product.productName}</strong>
                        <p className="muted">
                          {product.brand || "Sin marca"} | {product.category || "Sin categoria"}
                        </p>
                        {product.extraInfo ? <p className="muted">{product.extraInfo}</p> : null}
                      </td>
                      <td>
                        <span className="price-highlight">
                          {product.bestPrice ? `EUR ${product.bestPrice.toFixed(2)}` : "-"}
                        </span>
                      </td>
                      <td>
                        <span className="badge">{product.bestStore || "-"}</span>
                      </td>
                      {stores.map((store) => {
                        const offer = product.offers.find((item) => item.storeId === store.id);
                        return (
                          <td key={`${product.productId}-${store.id}`}>
                            {offer ? (
                              <span className={offer.storeName === product.bestStore ? "store-price best" : "store-price"}>
                                EUR {offer.price.toFixed(2)}
                              </span>
                            ) : (
                              <span className="store-price empty">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <div className="actions-cell">
                          {user ? (
                            <FavoriteButton
                              initiallyFavorite={favoriteIds.includes(product.productId)}
                              productId={product.productId}
                            />
                          ) : null}
                          <PriceHistoryModal productId={product.productId} productName={product.productName} />
                          {user ? <EditProductForm product={product} stores={stores} /> : null}
                          {user ? <DeleteProductButton productId={product.productId} /> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </section>
  );
}
