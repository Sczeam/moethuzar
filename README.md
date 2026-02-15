# Moethuzar (Next.js + Prisma + Supabase)

Foundation scope and standards:
- `docs/foundation-mvp.md`
- Launch operations runbook:
  - `docs/launch-ops-runbook.md`

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

# Supabase SSR/Auth config (official Next.js SSR pattern)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."

# Optional: make seed admin user map to your real Supabase Auth user id
ADMIN_AUTH_USER_ID="11111111-1111-1111-1111-111111111111"

# Cloudflare R2 (admin image uploads)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_BASE_URL="https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev"
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
- `GET /api/health/ready`

## API Endpoints (Current)

- `GET /api/cart`
- `POST /api/cart` (body: `{ "variantId": "uuid", "quantity": 1 }`)
- `PATCH /api/cart` (body: `{ "variantId": "uuid", "quantity": 2 }`)
- `DELETE /api/cart` (body: `{ "variantId": "uuid" }`)
- `POST /api/checkout` (COD checkout payload)
- `GET /api/products`
- `GET /api/products/[slug]`
- `GET /api/orders/[orderCode]`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `GET /api/admin/orders` (optional query `?status=PENDING`)
- `GET /api/admin/orders/[orderId]`
- `PATCH /api/admin/orders/[orderId]/status` (body: `{ "toStatus": "CONFIRMED", "note": "..." }`)
- `GET /api/admin/catalog`
- `POST /api/admin/catalog`
- `GET /api/admin/catalog/[productId]`
- `PATCH /api/admin/catalog/[productId]`
- `POST /api/admin/catalog/[productId]/inventory`
- `POST /api/admin/catalog/upload-image` (multipart form field: `file`)

Admin auth uses Supabase SSR session cookies (`@supabase/ssr`).
Admin endpoints can also accept `Authorization: Bearer <supabase_access_token>`.

Admin web login:

- Use `/admin/login` with a Supabase Auth user mapped to `AdminUser.authUserId`
- Session is managed by Supabase SSR helpers in `lib/supabase/*`
- `/admin/*` routes are protected via `proxy.ts` + `updateSession`
- `/admin/catalog` uploads images to Cloudflare R2 and stores resulting URL in `ProductImage.url`

Customer pages:

- `/` product listing
- `/products/[slug]` product detail
- `/cart` cart
- `/checkout` COD checkout
- `/order/success/[orderCode]` order confirmation
- `/order/track` order lookup page

## Admin Bootstrap (Supabase + Prisma)

Your admin login must satisfy both checks:

1. Supabase Auth user metadata includes admin role:
   - `raw_app_meta_data.role = "admin"`
   - `raw_app_meta_data.roles` contains `"admin"`
2. Prisma `AdminUser` has matching `authUserId` and `isActive = true`.

Example SQL (Supabase SQL editor):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin","roles":["admin"]}'::jsonb
where email = 'admin@yourdomain.com';
```

Then ensure `AdminUser.authUserId` matches that user ID.

## Reliability Notes

- Cart token is rotated after successful checkout to prevent converted-cart reuse.
- Cart/session cookie parsing is tolerant to malformed cookie values.
- API error responses include `requestId` for debugging and server log correlation.

## Manual QA

- `docs/mvp-qa-checklist.md`

## Test

```bash
pnpm test
```

## Release Preflight

```bash
pnpm check:preflight
```
