"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { showToast } from "@/lib/toast";

type Props = {
  productId: number;
  initiallyFavorite: boolean;
};

export function FavoriteButton({ productId, initiallyFavorite }: Props) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initiallyFavorite);
  const [isPending, startTransition] = useTransition();

  async function toggleFavorite() {
    const method = isFavorite ? "DELETE" : "POST";

    const response = await fetch("/api/favorites", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId })
    });

    if (!response.ok) {
      showToast("No se pudo actualizar favorito", "error");
      return;
    }

    setIsFavorite(!isFavorite);
    showToast(isFavorite ? "Favorito eliminado" : "Favorito guardado", "success");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      aria-label={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`favorite-btn ${isFavorite ? "is-favorite" : ""}`}
      disabled={isPending}
      onClick={toggleFavorite}
      title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
      type="button"
    >
      <svg aria-hidden="true" className="favorite-icon" viewBox="0 0 24 24">
        <path d="M12 21 10.55 19.68C5.4 15 2 11.91 2 8.12 2 5.03 4.42 2.6 7.5 2.6c1.74 0 3.41.8 4.5 2.08A6.01 6.01 0 0 1 16.5 2.6C19.58 2.6 22 5.03 22 8.12c0 3.8-3.4 6.88-8.55 11.56z" />
      </svg>
      <span className="sr-only">{isFavorite ? "Quitar favorito" : "Guardar favorito"}</span>
    </button>
  );
}
