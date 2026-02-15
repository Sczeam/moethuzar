# Moethuzar

Production-oriented apparel storefront built with Next.js App Router, Prisma, Supabase Postgres, Supabase SSR auth, and Cloudflare R2.

## References

- MVP scope: `docs/foundation-mvp.md`
- Frontend architecture: `docs/frontend-architecture.md`
- Launch runbook: `docs/launch-ops-runbook.md`
- Manual QA: `docs/mvp-qa-checklist.md`

## Tech Stack

- Next.js `16` (App Router)
- React `19`
- TypeScript
- Prisma `7` + PostgreSQL adapter
- Supabase Postgres + Supabase SSR auth
- Tailwind CSS `4`
- GSAP (menu/search motion)
- Cloudflare R2 (admin image uploads)

## Prerequisites

- Node.js `20+`
- pnpm
- Supabase project (Postgres + Auth)
- Cloudflare R2 bucket (for catalog images)

## Environment Variables

Copy `.env.example` to `.env` and fill values.

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."

ADMIN_AUTH_USER_ID="11111111-1111-1111-1111-111111111111"
ADMIN_EMAIL="admin@yourdomain.com"

R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_BASE_URL="https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev"
```

If DB password contains special characters (`@`, `#`, `*`, etc.), URL-encode it.

## Local Setup

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate -- --name init
pnpm prisma:seed
pnpm dev
```

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm check:preflight`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`
- `pnpm prisma:studio`

## Main App Pages

- `/` home + hero + latest products
- `/search` product search results page
- `/products/[slug]` product detail page
- `/cart`
- `/checkout` (COD + required terms/privacy consent checkbox)
- `/order/success/[orderCode]`
- `/order/track`
- `/terms`
- `/privacy`
- `/returns`
- `/contact`
- `/admin/login`
- `/admin/catalog`
- `/admin/orders`

## API Surface

Storefront/customer:

- `GET /api/health/db`
- `GET /api/health/ready`
- `GET /api/products`
- `GET /api/products/[slug]`
- `GET /api/search/products`
- `GET /api/cart`
- `POST /api/cart` body: `{ "variantId": "uuid", "quantity": 1 }`
- `PATCH /api/cart` body: `{ "variantId": "uuid", "quantity": 2 }`
- `DELETE /api/cart` body: `{ "variantId": "uuid" }`
- `POST /api/checkout`
- `GET /api/orders/[orderCode]`

Admin:

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `GET /api/admin/catalog`
- `POST /api/admin/catalog`
- `GET /api/admin/catalog/[productId]`
- `PATCH /api/admin/catalog/[productId]`
- `POST /api/admin/catalog/[productId]/inventory`
- `POST /api/admin/catalog/upload-image`
- `GET /api/admin/orders` supports `status`, `q`, `from`, `to`, `page`, `pageSize`, `format=json|csv`
- `GET /api/admin/orders/[orderId]`
- `PATCH /api/admin/orders/[orderId]/status`

## Admin Bootstrap

Admin access requires both:

1. Supabase user metadata includes admin role.
2. Prisma `AdminUser` row exists with matching `authUserId` and `isActive=true`.

Example Supabase SQL:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin","roles":["admin"]}'::jsonb
where email = 'admin@yourdomain.com';
```

## Notes

- Cart is variant-based (`variantId`), and cart token is rotated after checkout.
- Inventory source of truth is `ProductVariant.inventory`.
- Structured API error payloads include `requestId`.
- Core storefront images use Next.js `Image` with remote R2 config in `next.config.ts`.

## CI / Protected Branch

- `master` is protected: merge via PR only.
- CI workflow runs lint, typecheck, test, and build.
- `pnpm prisma:generate` needs `DIRECT_URL` present in CI env.
