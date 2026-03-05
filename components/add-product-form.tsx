"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type StoreOption = {
  id: number;
  name: string;
};

type Props = {
  stores: StoreOption[];
};

export function AddProductForm({ stores }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [selectedStores, setSelectedStores] = useState<Record<number, boolean>>({});
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = useMemo(
    () => Object.values(selectedStores).filter(Boolean).length,
    [selectedStores]
  );

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

    if (offers.length === 0) {
      setError("Selecciona al menos un supermercado con precio");
      showToast("Selecciona al menos un supermercado con precio", "error");
      return;
    }

    const response = await fetch("/api/products", {
      method: "POST",
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
      setError(payload.error || "No se pudo guardar");
      showToast(payload.error || "No se pudo guardar", "error");
      return;
    }

    setName("");
    setBrand("");
    setCategory("");
    setExtraInfo("");
    setSelectedStores({});
    setPrices({});
    setIsOpen(false);
    showToast("Producto creado correctamente", "success");

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="add-product-box">
      <div className="add-product-head">
        <div>
          <h2>Anadir producto</h2>
          <p className="muted">Guarda un producto y sus precios por supermercado.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsOpen((v) => !v)} type="button">
          {isOpen ? "Cerrar" : "Nuevo producto"}
        </button>
      </div>

      {isOpen ? (
        <form className="add-product-form" onSubmit={onSubmit}>
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
            <textarea
              onChange={(e) => setExtraInfo(e.target.value)}
              placeholder="Formato, tamano, notas, etc."
              rows={3}
              value={extraInfo}
            />
          </label>

          <div className="store-prices">
            <p>
              Supermercados seleccionados: <strong>{selectedCount}</strong>
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
                    placeholder="Precio"
                    step="0.01"
                    type="number"
                    value={prices[store.id] || ""}
                  />
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn-primary" disabled={isPending} type="submit">
            {isPending ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
