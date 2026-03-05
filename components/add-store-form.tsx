"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteStoreButton } from "@/components/delete-store-button";
import { EditStoreForm } from "@/components/edit-store-form";
import { showToast } from "@/lib/toast";

type StoreItem = {
  id: number;
  name: string;
  website: string | null;
};

type Props = {
  stores: StoreItem[];
};

export function AddStoreForm({ stores }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Error desconocido" }))) as {
        error?: string;
      };
      setError(payload.error || "No se pudo crear el supermercado");
      showToast(payload.error || "No se pudo crear el supermercado", "error");
      return;
    }

    setName("");
    setWebsite("");
    setIsOpen(false);
    showToast("Supermercado creado correctamente", "success");

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="add-store-box">
      <div className="add-product-head">
        <div>
          <h2>Anadir supermercado</h2>
          <p className="muted">Crea tiendas para luego asignarles precios en productos.</p>
        </div>
        <div className="action-inline">
          <button className="btn-secondary" onClick={() => setShowExisting((v) => !v)} type="button">
            {showExisting ? "Ocultar lista" : "Ver lista"}
          </button>
          <button className="btn-secondary" onClick={() => setIsOpen((v) => !v)} type="button">
            {isOpen ? "Cerrar" : "Nuevo supermercado"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <form className="add-product-form" onSubmit={onSubmit}>
          <div className="field-grid store-grid">
            <label>
              Nombre
              <input
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Aldi"
                required
                type="text"
                value={name}
              />
            </label>
            <label>
              Web (opcional)
              <input
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                type="url"
                value={website}
              />
            </label>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn-primary" disabled={isPending} type="submit">
            {isPending ? "Guardando..." : "Guardar supermercado"}
          </button>
        </form>
      ) : null}

      {showExisting ? (
        <div className="store-list-panel">
          <h3>Supermercados existentes</h3>
          <div className="store-edit-list">
            {stores.map((store) => (
              <div className="store-edit-item" key={store.id}>
                <span>{store.name}</span>
                <div className="actions-cell">
                  <EditStoreForm store={store} />
                  <DeleteStoreButton storeId={store.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
