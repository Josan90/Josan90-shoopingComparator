import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ToastHost } from "@/components/toast-host";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Comparador de precios",
  description: "Proyecto personal para comparar precios en supermercados"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        <header className="header">
          <div className="header-brand">
            <h1>PriceRadar</h1>
            <p>Comparador personal de supermercados</p>
          </div>
          <nav className="main-nav">
            {user ? (
              <>
                <Link href="/">Comparador</Link>
                <Link href="/favorites">Mis favoritos</Link>
                <span className="nav-user">{user.email}</span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">Entrar</Link>
                <Link href="/register">Crear cuenta</Link>
              </>
            )}
          </nav>
        </header>
        <main className="container">{children}</main>
        <ToastHost />
      </body>
    </html>
  );
}
