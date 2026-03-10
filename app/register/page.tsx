"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    setIsPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "No se pudo crear la cuenta" }))) as {
        error?: string;
      };
      const message = payload.error || "No se pudo crear la cuenta";
      setError(message);
      showToast(message, "error");
      return;
    }

    showToast("Cuenta creada", "success");
    router.push("/");
    router.refresh();
  }

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Crear cuenta</h2>
        <p className="muted">Puedes compartir credenciales con otras personas para mantener una lista conjunta.</p>
        <label>
          Nombre (opcional)
          <input onChange={(e) => setName(e.target.value)} type="text" value={name} />
        </label>
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
          Password (min 8)
          <input
            autoComplete="new-password"
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="btn-primary" disabled={isPending} type="submit">
          {isPending ? "Creando..." : "Crear cuenta"}
        </button>
        <p className="muted">
          Ya tienes cuenta? <Link href="/login">Entrar</Link>
        </p>
      </form>
    </section>
  );
}
