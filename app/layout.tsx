import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ToastHost } from "@/components/toast-host";

export const metadata: Metadata = {
  title: "Comparador de precios",
  description: "Proyecto personal para comparar precios en supermercados"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <header className="header">
          <div className="header-brand">
            <h1>PriceRadar</h1>
            <p>Comparador personal de supermercados</p>
          </div>
          <nav className="main-nav">
            <Link href="/">Comparador</Link>
            <Link href="/favorites">Mis favoritos</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
        <ToastHost />
      </body>
    </html>
  );
}
