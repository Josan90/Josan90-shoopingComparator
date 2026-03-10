import { AddProductForm } from "@/components/add-product-form";
import { AddStoreForm } from "@/components/add-store-form";
import { DeleteProductButton } from "@/components/delete-product-button";
import { EditProductForm } from "@/components/edit-product-form";
import { FavoriteButton } from "@/components/favorite-button";
import { PaginationControls } from "@/components/pagination-controls";
import { PriceHistoryModal } from "@/components/price-history-modal";
import { ProductsSearchInput } from "@/components/products-search-input";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteProductIds, getProductsComparison, getStores } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildNormalizedWithMap(value: string) {
  let normalized = "";
  const map: number[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const folded = value[i]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (let j = 0; j < folded.length; j += 1) {
      normalized += folded[j];
      map.push(i);
    }
  }

  return { normalized, map };
}

function highlightMatch(value: string, query?: string) {
  if (!query) {
    return value;
  }

  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return value;
  }

  const { normalized, map } = buildNormalizedWithMap(value);
  const start = normalized.indexOf(normalizedQuery);
  if (start === -1) {
    return value;
  }

  const startIndex = map[start];
  const endIndex = (map[start + normalizedQuery.length - 1] ?? startIndex) + 1;

  return (
    <>
      {value.slice(0, startIndex)}
      <mark className="search-highlight">{value.slice(startIndex, endIndex)}</mark>
      {value.slice(endIndex)}
    </>
  );
}

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const query = q?.trim();
  const currentPage = Math.max(1, Number(page) || 1);

  const user = await getCurrentUser();
  const userId = user?.id;
  const [products, stores, favoriteIds] = await Promise.all([
    userId ? getProductsComparison(userId, query) : Promise.resolve([]),
    userId ? getStores(userId) : Promise.resolve([]),
    userId ? getFavoriteProductIds(userId) : Promise.resolve([])
  ]);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
            Inicia sesión para ver tus productos y gestionar supermercados.
          </p>
        </section>
      )}

      <section className="panel">
        <ProductsSearchInput initialValue={query || ""} />

        {products.length === 0 ? (
          <p className="empty-state">
            No hay productos cargados en la base de datos. Puedes anadir uno con el boton Nuevo producto.
          </p>
        ) : (
          <>
            <div className="results-toolbar">
              <p className="muted">
                Mostrando {paginatedProducts.length} de {products.length} productos.
              </p>
              <PaginationControls page={safePage} pathname="/" query={query} totalPages={totalPages} />
            </div>

            <div className="mobile-cards">
              {paginatedProducts.map((product) => (
                <article className="result-card" key={product.productId}>
                  <div className="result-head">
                    <h3>{highlightMatch(product.productName, query)}</h3>
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
                    Mejor precio: <strong>{product.bestPrice ? product.bestPrice.toFixed(2) : "-"}</strong>
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
                          {offer.storeName}: {offer.price.toFixed(2)}
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
                  {paginatedProducts.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <strong>{highlightMatch(product.productName, query)}</strong>
                        <p className="muted">
                          {product.brand || "Sin marca"} | {product.category || "Sin categoria"}
                        </p>
                        {product.extraInfo ? <p className="muted">{product.extraInfo}</p> : null}
                      </td>
                      <td>
                        <span className="price-highlight">
                          {product.bestPrice ? product.bestPrice.toFixed(2) : "-"}
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
                                {offer.price.toFixed(2)}
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

            <PaginationControls page={safePage} pathname="/" query={query} totalPages={totalPages} />
          </>
        )}
      </section>
    </section>
  );
}
