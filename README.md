# Comparador de precios (Next.js + Neon Postgres)

Proyecto personal sencillo para comparar precios de productos entre supermercados y guardar favoritos.

## Incluye

- Comparador de productos con mejor precio por tienda
- Buscador por nombre, marca o categoria
- Favoritos por usuario autenticado (cuenta compartible)
- Alta manual de productos con informacion extra y precios por supermercado
- Esquema de datos con Prisma + PostgreSQL (Neon)
- Seed con datos demo

## Requisitos

- Node.js 20+
- Cuenta en Neon (PostgreSQL)

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` desde el ejemplo:

```bash
cp .env.example .env
```

3. Crea una base de datos en Neon y copia las dos cadenas:
- `DATABASE_URL`: usa la URL **pooled** (host con `-pooler`) para la app en runtime/serverless.
- `DIRECT_URL`: usa la URL **directa** (sin `-pooler`) para migraciones y herramientas Prisma.

Ejemplo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@EP-XXXX-XXXX-pooler.us-east-1.aws.neon.tech/DBNAME?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@EP-XXXX-XXXX.us-east-1.aws.neon.tech/DBNAME?sslmode=require&connect_timeout=15"
DEFAULT_USER_EMAIL="demo@local.dev"
DEFAULT_USER_PASSWORD="demo12345"
AUTH_SECRET="una-clave-larga-de-32-o-mas-caracteres"
```

4. Aplica esquema y genera cliente:

```bash
npx prisma db push
npm run prisma:generate
```

5. Carga datos demo:

```bash
npm run db:seed
```

6. Arranca el proyecto:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Estructura clave

- `prisma/schema.prisma`: modelos PostgreSQL (User, Product, Store, PriceSnapshot, Favorite)
- `app/page.tsx`: comparador principal
- `app/favorites/page.tsx`: vista de favoritos
- `app/api/favorites/route.ts`: alta/baja de favoritos
- `app/api/products/route.ts`: alta de producto y precios iniciales
- `lib/data.ts`: logica de consulta y comparacion

## Autenticacion

- Registro y login por email/password.
- Sesion con cookie HTTP-only firmada.
- Endpoints de escritura (`products`, `stores`, `favorites`) requieren sesion.
- Puedes compartir una misma cuenta entre varias personas para tener la misma lista de favoritos.

El seed crea (o actualiza) la cuenta inicial usando:

- `DEFAULT_USER_EMAIL`
- `DEFAULT_USER_PASSWORD`

## Vercel + Neon

En Vercel (Project Settings -> Environment Variables), define:

- `DATABASE_URL` (Neon pooled URL)
- `DIRECT_URL` (Neon direct URL)
- `DEFAULT_USER_EMAIL`
- `DEFAULT_USER_PASSWORD` (solo para seed inicial)
- `AUTH_SECRET` (obligatorio en produccion)

Con eso, cada deploy podra conectarse a Neon sin configuracion adicional en codigo.
