"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    setIsPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Error de autenticacion" }))) as {
        error?: string;
      };
      const message = payload.error || "Error de autenticacion";
      setError(message);
      showToast(message, "error");
      return;
    }

    showToast("Sesion iniciada", "success");
    router.push("/");
    router.refresh();
  }

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Entrar</h2>
        <p className="muted">Puedes compartir esta cuenta con varias personas para mantener una lista comun.</p>
        <label>
          Email
          <input
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn-primary" disabled={isPending} type="submit">
          {isPending ? "Entrando..." : "Entrar"}
        </button>
        <p className="muted">
          No tienes cuenta? <Link href="/register">Crea una</Link>
        </p>
      </form>
    </section>
  );
}
