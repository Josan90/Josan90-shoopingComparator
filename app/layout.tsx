import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { ToastHost } from "@/components/toast-host";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Comparador de precios",
  description: "Proyecto personal para comparar precios en supermercados"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              var storageKey = "price-radar:theme";
              var stored = window.localStorage.getItem(storageKey);
              var preference = stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
              var resolved = preference === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : preference === "auto"
                  ? "light"
                  : preference;

              document.documentElement.dataset.theme = resolved;
              document.documentElement.dataset.themePreference = preference;
            })();
          `}
        </Script>
      </head>
      <body>
        <header className="header">
          <div className="header-brand">
            <h1>PriceRadar</h1>
            <p>Comparador personal de supermercados</p>
          </div>
          <nav className="main-nav">
            <ThemeToggle />
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
