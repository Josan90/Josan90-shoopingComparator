"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onLogout() {
    setIsPending(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    setIsPending(false);

    if (!response.ok) {
      showToast("No se pudo cerrar sesion", "error");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button className="btn-secondary btn-small" disabled={isPending} onClick={onLogout} type="button">
      {isPending ? "..." : "Cerrar sesion"}
    </button>
  );
}
