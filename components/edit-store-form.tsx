"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

type Props = {
  store: {
    id: number;
    name: string;
    website: string | null;
  };
};

export function EditStoreForm({ store }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(store.name);
  const [website, setWebsite] = useState(store.website || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/stores/${store.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, website })
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
    showToast("Supermercado actualizado", "success");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="edit-store-row">
      <button
        aria-label="Editar supermercado"
        className="action-icon"
        onClick={() => setIsOpen((v) => !v)}
        title="Editar supermercado"
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m3 17.25 10.02-10.02 3.75 3.75L6.75 21H3v-3.75zM14.8 5.45l1.4-1.4a1.5 1.5 0 0 1 2.12 0l1.63 1.63a1.5 1.5 0 0 1 0 2.12l-1.4 1.4-3.75-3.75z" />
        </svg>
      </button>

      {isOpen ? (
        <form className="edit-store-form" onSubmit={onSubmit}>
          <input onChange={(e) => setName(e.target.value)} required type="text" value={name} />
          <input
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            type="url"
            value={website}
          />
          <button className="btn-primary btn-small" disabled={isPending} type="submit">
            {isPending ? "..." : "Guardar"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
