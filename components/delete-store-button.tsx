"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/lib/toast";

type Props = {
  storeId: number;
};

export function DeleteStoreButton({ storeId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    const confirmed = window.confirm("Quieres eliminar este supermercado?");
    if (!confirmed) return;

    setError(null);
    const response = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Error desconocido" }))) as {
        error?: string;
      };
      setError(payload.error || "No se pudo eliminar");
      showToast(payload.error || "No se pudo eliminar", "error");
      return;
    }

    showToast("Supermercado eliminado", "success");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div>
      <button
        aria-label="Eliminar supermercado"
        className="action-icon action-danger"
        disabled={isPending}
        onClick={onDelete}
        title="Eliminar supermercado"
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-2 6h2v9H7V9zm4 0h2v9h-2V9zm4 0h2v9h-2V9z" />
        </svg>
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
