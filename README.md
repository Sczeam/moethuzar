# Moethuzar (Next.js + Prisma + Supabase)

Foundation scope and standards:
- `docs/foundation-mvp.md`

## Prerequisites

- Node.js 20+
- pnpm
- A Supabase Postgres project

## Environment Variables

Create `.env` with:

```bash
# Used by runtime app queries (pooler URL is fine)
DATABASE_URL="postgresql://..."

# Used by Prisma migrations (direct DB URL recommended)
DIRECT_URL="postgresql://..."
```

If your password has special characters (`@`, `#`, `*`, etc), URL-encode it.

## Database Setup

Install dependencies:

```bash
pnpm install
```

Generate Prisma client:

```bash
pnpm prisma:generate
```

Create/apply migration:

```bash
pnpm prisma:migrate -- --name init
```

Seed starter catalog data:

```bash
pnpm prisma:seed
```

## Run the App

```bash
pnpm dev
```

Health check endpoint:

- `GET /api/health/db`

## API Endpoints (Current)

- `GET /api/cart`
- `POST /api/cart` (body: `{ "variantId": "uuid", "quantity": 1 }`)
- `PATCH /api/cart` (body: `{ "variantId": "uuid", "quantity": 2 }`)
- `DELETE /api/cart` (body: `{ "variantId": "uuid" }`)
- `POST /api/checkout` (COD checkout payload)
- `GET /api/admin/orders` (optional query `?status=PENDING`)
- `GET /api/admin/orders/[orderId]`
- `PATCH /api/admin/orders/[orderId]/status` (body: `{ "toStatus": "CONFIRMED", "note": "..." }`)

Admin endpoints currently require header:

- `x-admin-user-id: <AdminUser.id>`

## Test

```bash
pnpm test
```
