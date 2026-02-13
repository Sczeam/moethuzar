# Foundation: MVP Scope and Standards

## 1) MVP Scope (v1)

### Customer side
- Browse product list
- View product detail
- Add product to cart
- Edit cart quantity/remove items
- Checkout form (Cash on Delivery):
  - Full name
  - Phone number (required)
  - Email (optional)
  - Full address (region/state, township/city, street/address details)
  - Order note (optional)
- Place order
- See order success page with order code

### Admin side
- Secure admin login
- Orders page:
  - View all orders
  - Filter by status
  - Open order detail
  - Update status after phone confirmation
- Status workflow for MVP:
  - `PENDING` (new order)
  - `CONFIRMED` (after admin calls customer)
  - `DELIVERING`
  - `DELIVERED`
  - `CANCELLED`

### Out of scope for v1
- Online payment gateway (Stripe, etc.)
- Customer account dashboard/history
- Coupons/discount engine
- Automated shipping integrations
- Advanced analytics

## 2) Frozen Core Stack

- Frontend/backend framework: Next.js (App Router)
- ORM: Prisma
- Database: Supabase Postgres
- Payment: Cash on Delivery only
- File storage (product images): Supabase Storage
- Validation: Zod
- Styling: Tailwind CSS

### Auth recommendation
- Use **Supabase Auth for admin users only in MVP**.
- Customer checkout should be **guest checkout** (no forced signup) to reduce friction.
- Reason:
  - COD flow does not require payment account linking.
  - Admin-only auth is simpler and safer for v1.
  - You can add customer auth later without reworking order flow.

## 3) Order and Checkout Flow (Frozen)

1. Customer adds items to cart.
2. Customer fills billing/shipping form.
3. Customer places COD order.
4. System creates order with status `PENDING`.
5. Admin opens order list and calls customer.
6. Admin updates status to `CONFIRMED` or `CANCELLED`.
7. During fulfillment admin sets `DELIVERING`.
8. When completed admin sets `DELIVERED`.

## 4) Data Model Direction (MVP)

Current models exist for catalog. Next schema expansion should include:
- `Order`
- `OrderItem`
- `OrderAddress`
- `OrderStatusHistory` (optional but recommended)
- `AdminUser` or role field linked to Supabase auth identity

Key rule:
- Order items must store product snapshot fields (`name`, `price`) to preserve historical accuracy.

## 5) Project Standards (Industry baseline)

### Code quality
- TypeScript strict mode enabled
- ESLint must pass before merge
- No direct DB calls in UI components; use route handlers/services
- Validate all incoming payloads with Zod

### Git workflow
- Branch naming:
  - `feat/...`, `fix/...`, `chore/...`
- Small PRs with clear scope
- No direct commits to `main`

### Testing
- Minimum for MVP:
  - Unit tests for order creation/status transition logic
  - Integration test for checkout API
- Add E2E tests for:
  - Add-to-cart -> place order
  - Admin status update

### Security
- Admin routes protected by Supabase Auth session + role check
- Server-side authorization for all admin mutations
- Rate limit order placement endpoint
- Never expose service role key to client

### Observability
- Structured server logs for checkout and order status transitions
- Include order id and status in logs for tracing

### Environment management
- `.env.example` kept up to date
- Separate env values for local/staging/production
- Rotate credentials if leaked

## 6) Definition of Done for MVP

- Customer can place COD order successfully.
- Admin can view and update order status.
- Prisma migrations and seed run cleanly.
- Lint/build/tests pass in CI.
- Production deploy is stable with working database connectivity.
