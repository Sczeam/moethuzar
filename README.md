# Moethuzar

Production-oriented apparel storefront for Myanmar, built with Next.js App Router, Prisma, Supabase Postgres/Auth, and Cloudflare R2.

## Documentation

- MVP scope: `docs/foundation-mvp.md`
- Frontend architecture: `docs/frontend-architecture.md`
- Admin architecture (OCP): `docs/admin-architecture-ocp.md`
- Admin A2 plan: `docs/admin-a2-order-ops-plan.md`
- Admin settings copy contract (A6.1): `docs/admin-settings-copy-contract-a6-1.md`
- Admin settings QA matrix (A6.5): `docs/admin-settings-qa-matrix-a6-5.md`
- Admin settings rollout checklist (A6.5): `docs/admin-settings-rollout-checklist-a6-5.md`
- Launch operations runbook: `docs/launch-ops-runbook.md`
- Manual QA checklist: `docs/mvp-qa-checklist.md`

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL adapter (`@prisma/adapter-pg`)
- Supabase Postgres + Supabase SSR Auth
- Cloudflare R2 (catalog image storage)
- GSAP (menu/search motion)

## Current MVP Capabilities

- Variant-based catalog (color/size variants, SKU-level inventory)
- Cart + checkout:
  - COD (zone-based)
  - prepaid transfer with payment-proof upload and admin verification
- Shipping fee rules by Myanmar zones
- Order tracking and admin order workflow
- Admin operations dashboard (`/admin`) with:
  - urgent follow-up lane
  - order queue cards with direct filtered links
  - revenue/sales snapshot + recent orders + top products
  - quick action cards for daily workflows
- Admin order workspace (`/admin/orders`) with:
  - KPI cards
  - table/list view by responsive layout
  - fast filters for order + payment review status
  - guided action model on order detail (`/admin/orders/[orderId]`)
- Admin catalog editor with:
  - bulk variant editing
  - matrix generation
  - draft validation
  - drag/drop multi-image upload queue
  - real upload progress (signed R2 upload)
  - inline category creation flow from dropdown modal
- Admin transfer-method management (bank / KBZPay / AyaPay / WavePay)

## Environment Variables

Copy `.env.example` to `.env` and fill all required values.

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

Notes:

- URL-encode special characters in DB passwords.
- `DATABASE_URL` should use Supabase pooler URL.
- `DIRECT_URL` should use direct DB URL for Prisma migrations.

## Local Development

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

## Main Pages

Storefront:

- `/`
- `/search`
- `/lookbook`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/order/success/[orderCode]`
- `/order/track`
- `/terms`
- `/privacy`
- `/returns`
- `/contact`

Admin:

- `/admin/login`
- `/admin`
- `/admin/catalog`
- `/admin/orders`
- `/admin/orders/[orderId]`
- `/admin/shipping-rules`
- `/admin/payment-transfer-methods`

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
- `POST /api/checkout/shipping-quote`
- `GET /api/checkout/prepaid-transfer-methods`
- `POST /api/checkout/payment-proof/sign`
- `POST /api/checkout/payment-proof/upload`
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
- `POST /api/admin/catalog/categories`
- `POST /api/admin/catalog/upload-image`
- `POST /api/admin/catalog/upload-image/sign`
- `POST /api/admin/catalog/validate-draft`
- `POST /api/admin/catalog/variant-matrix`
- `GET /api/admin/catalog/variant-presets`
- `GET /api/admin/orders` supports `status`, `q`, `from`, `to`, `page`, `pageSize`, `format=json|csv`
- `GET /api/admin/orders/[orderId]`
- `PATCH /api/admin/orders/[orderId]/status`
- `PATCH /api/admin/orders/[orderId]/payment`
- `GET /api/admin/shipping-rules`
- `POST /api/admin/shipping-rules`
- `PATCH /api/admin/shipping-rules/[ruleId]`
- `DELETE /api/admin/shipping-rules/[ruleId]`
- `GET /api/admin/payment-transfer-methods`
- `POST /api/admin/payment-transfer-methods`
- `PATCH /api/admin/payment-transfer-methods/[methodId]`
- `DELETE /api/admin/payment-transfer-methods/[methodId]`

## Admin Access Bootstrap

Admin access requires both:

1. Supabase Auth user has admin role metadata.
2. Prisma `AdminUser` row exists with matching `authUserId` and `isActive=true`.

Example Supabase SQL:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin","roles":["admin"]}'::jsonb
where email = 'admin@yourdomain.com';
```

## Deployment Notes (Vercel + Supabase + R2)

- Add all environment variables in Vercel Project Settings.
- Ensure `DIRECT_URL` exists in CI/build environment (required for `pnpm prisma:generate`).
- For direct browser uploads to R2 via signed URLs, configure bucket CORS to allow your site origin and `PUT`.
- Current uploader has server-upload fallback if direct upload is blocked.

## Operational Notes

- Inventory source of truth: `ProductVariant.inventory`.
- Cart is variant-based; cart token rotates after successful checkout.
- Prepaid checkout supports proof upload with signed-R2 path and server-upload fallback.
- API errors return consistent structured payloads with `requestId`.
- `master` is protected; merge through PR.
