# Comparador de precios (Next.js + MySQL)

Proyecto personal sencillo para comparar precios de productos entre supermercados y guardar favoritos.

## Incluye

- Comparador de productos con mejor precio por tienda
- Buscador por nombre, marca o categoria
- Favoritos por usuario
- Alta manual de productos con informacion extra y precios por supermercado
- Esquema de datos con Prisma + MySQL
- Seed con datos demo

## Requisitos

- Node.js 20+
- MySQL 8+

## Configuracion

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` desde el ejemplo:

```bash
cp .env.example .env
```

3. Edita `DATABASE_URL` en `.env` con tu MySQL.

Ejemplo:

```env
DATABASE_URL="mysql://root:password@localhost:3306/price_compare"
DEFAULT_USER_EMAIL="demo@local.dev"
```

4. Sincroniza esquema y genera cliente:

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

- `prisma/schema.prisma`: modelos MySQL (User, Product, Store, PriceSnapshot, Favorite)
- `app/page.tsx`: comparador principal
- `app/favorites/page.tsx`: vista de favoritos
- `app/api/favorites/route.ts`: alta/baja de favoritos
- `app/api/products/route.ts`: alta de producto y precios iniciales
- `lib/data.ts`: logica de consulta y comparacion

## Nota actual

La autenticacion no esta conectada todavia. Se usa un usuario por defecto via `DEFAULT_USER_EMAIL` para poder probar favoritos de forma inmediata.
