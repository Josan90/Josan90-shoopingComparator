"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type StoreOption = {
  id: number;
  name: string;
};

type Offer = {
  storeId: number;
  storeName: string;
  price: number;
};

type ProductInput = {
  productId: number;
  productName: string;
  brand: string | null;
  category: string | null;
  extraInfo: string | null;
  offers: Offer[];
};

type Props = {
  product: ProductInput;
  stores: StoreOption[];
};

export function EditProductForm({ product, stores }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.productName);
  const [brand, setBrand] = useState(product.brand || "");
  const [category, setCategory] = useState(product.category || "");
  const [extraInfo, setExtraInfo] = useState(product.extraInfo || "");
  const [selectedStores, setSelectedStores] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    product.offers.forEach((offer) => {
      init[offer.storeId] = true;
    });
    return init;
  });
  const [prices, setPrices] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    product.offers.forEach((offer) => {
      init[offer.storeId] = offer.price.toString();
    });
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = useMemo(
    () => Object.values(selectedStores).filter(Boolean).length,
    [selectedStores]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function toggleStore(storeId: number, checked: boolean) {
    setSelectedStores((prev) => ({ ...prev, [storeId]: checked }));
    if (!checked) {
      setPrices((prev) => ({ ...prev, [storeId]: "" }));
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const offers = stores
      .filter((store) => selectedStores[store.id])
      .map((store) => ({
        storeId: store.id,
        price: Number(prices[store.id])
      }))
      .filter((offer) => Number.isFinite(offer.price) && offer.price > 0);

    if (!name.trim()) {
      setError("El nombre es obligatorio");
      showToast("El nombre es obligatorio", "error");
      return;
    }

    const response = await fetch(`/api/products/${product.productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brand,
        category,
        extraInfo,
        offers
      })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Error desconocido" }))) as {
        error?: string;
      };
      setError(payload.error || "No se pudo actualizar");
      showToast(payload.error || "No se pudo actualizar", "error");
      return;
    }

    setIsOpen(false);
    showToast("Producto actualizado", "success");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="edit-wrap">
      <button
        aria-label="Editar producto"
        className="action-icon"
        onClick={() => setIsOpen((v) => !v)}
        title="Editar producto"
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m3 17.25 10.02-10.02 3.75 3.75L6.75 21H3v-3.75zM14.8 5.45l1.4-1.4a1.5 1.5 0 0 1 2.12 0l1.63 1.63a1.5 1.5 0 0 1 0 2.12l-1.4 1.4-3.75-3.75z" />
        </svg>
      </button>

      {isOpen ? (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)} role="presentation">
          <form className="edit-product-form" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
            <div className="edit-modal-head">
              <h3>Editar producto</h3>
              <button className="btn-secondary btn-small" onClick={() => setIsOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <div className="field-grid">
              <label>
                Nombre
                <input onChange={(e) => setName(e.target.value)} required type="text" value={name} />
              </label>
              <label>
                Marca
                <input onChange={(e) => setBrand(e.target.value)} type="text" value={brand} />
              </label>
              <label>
                Categoria
                <input onChange={(e) => setCategory(e.target.value)} type="text" value={category} />
              </label>
            </div>

            <label>
              Informacion extra
              <textarea onChange={(e) => setExtraInfo(e.target.value)} rows={2} value={extraInfo} />
            </label>

            <div className="store-prices compact">
              <p>
                Tiendas con precio actualizado: <strong>{selectedCount}</strong>
              </p>
              <div className="store-list">
                {stores.map((store) => (
                  <div className="store-item" key={store.id}>
                    <label className="store-check">
                      <input
                        checked={Boolean(selectedStores[store.id])}
                        onChange={(e) => toggleStore(store.id, e.target.checked)}
                        type="checkbox"
                      />
                      {store.name}
                    </label>
                    <input
                      disabled={!selectedStores[store.id]}
                      min="0"
                      onChange={(e) => setPrices((prev) => ({ ...prev, [store.id]: e.target.value }))}
                      step="0.01"
                      type="number"
                      value={prices[store.id] || ""}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <button className="btn-primary btn-small" disabled={isPending} type="submit">
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
