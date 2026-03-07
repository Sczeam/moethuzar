# Phase B QA Matrix

Scope:
- Customer auth routes:
  - `/account/login`
  - `/account/register`
  - `/account/forgot-password`
  - `/account/reset-password`
  - `/account`
  - `/account/orders`
- Customer auth APIs:
  - `GET /api/account/auth/me`
  - `POST /api/account/auth/logout`
  - `GET /api/account/orders`
- Checkout + success-page account nudges:
  - `/checkout`
  - `/order/success/[orderCode]`

Environment prerequisites:
- Supabase Auth configured and reachable
- Prisma schema synced with `Customer` and `Order.customerId`
- At least one existing customer-auth user
- At least one guest order and one signed-in order available for verification

## B1 Foundation

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| B1-01 | Guest checkout still works after schema changes | Place order while signed out | Order succeeds; no `customerId` required |
| B1-02 | Customer identity resolves from signed-in session | Hit signed-in checkout flow | Resolver returns `kind=customer`; no guest degradation |
| B1-03 | Public order tracking boundary unchanged | Open `/order/track`, fetch public order | Public response stays minimal and does not expose customer ownership fields |

## B2 Auth Routes + Middleware

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| B2-01 | Account login page accessible while signed out | Visit `/account/login` signed out | Page renders, no redirect loop |
| B2-02 | Account register page accessible while signed out | Visit `/account/register` signed out | Page renders, no redirect loop |
| B2-03 | Forgot password page accessible while signed out | Visit `/account/forgot-password` signed out | Page renders, no redirect loop |
| B2-04 | Protected account route redirects to login | Visit `/account` signed out | Redirects to `/account/login?next=%2Faccount` |
| B2-05 | Signed-in user bypasses login/register screens | Visit `/account/login` and `/account/register` signed in | Redirects to sanitized internal account destination |
| B2-06 | Unsafe next parameter is rejected | Open login/register with external `next` | Redirect falls back to safe internal path |
| B2-07 | Logout is idempotent | Call logout signed in, then again signed out | No crash; ends unauthenticated both times |
| B2-08 | Me endpoint is minimal and uncached | Call `GET /api/account/auth/me` | `200`, `Cache-Control: no-store`, payload contains only `id` and `email` or `null` |

## B3 Checkout Order Linking

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| B3-01 | Signed-in checkout links order on first write | Sign in, place order | Order succeeds; stored with `customerId` |
| B3-02 | Guest checkout remains unlinked | Sign out, place order | Order succeeds; stored with `customerId = null` |
| B3-03 | Client cannot inject customerId | Tamper checkout payload with custom `customerId` | Server ignores it |
| B3-04 | Identity resolver degradation does not block checkout | Simulate resolver failure | Order still succeeds as guest; warn log emitted |
| B3-05 | Idempotent replay does not mutate ownership | First checkout as guest, replay same idempotency key while signed in | Existing order returned unchanged |

## B4 My Orders

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| B4-01 | Signed-in user sees only own orders | Visit `/account/orders` signed in | Only that customer's orders appear |
| B4-02 | Signed-out user cannot access orders API | Call `GET /api/account/orders` signed out | `401` with stable auth error envelope |
| B4-03 | Cursor pagination works | Load first page, then load more | `nextCursor` and `hasMore` behave consistently |
| B4-04 | Foreign cursor does not leak another user’s data | Reuse cursor from different customer context | No cross-customer data leak |
| B4-05 | Orders list links safely to public tracking route | Click order item link from account orders | Opens `/order/track?code=...` only |

## B2 Extension: Checkout + Success Account Nudges

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| B5-01 | Opt-in off keeps guest flow unchanged | Checkout with create-account unchecked | Order succeeds; no account-intent messaging |
| B5-02 | Signed-in checkout hides opt-in | Visit checkout signed in | Account opt-in inputs are hidden; email prefilled if empty |
| B5-03 | Opt-in requires email + valid password | Enable create-account, submit invalid fields | Inline validation on email/password/confirm fields |
| B5-04 | Opt-in new account remains non-blocking | Enable create-account with new email, place order | Order succeeds; success page shows sign-in CTA |
| B5-05 | Existing email does not block order | Enable create-account using existing email | Order succeeds; success page shows sign-in + reset CTA |
| B5-06 | Account-intent failure does not block order | Simulate registration/upsert failure | Order succeeds; success page shows create-account fallback CTA |
| B5-07 | Success CTA for signed-in customer | View success page while signed in | Shows `Go to My Account` CTA only |
| B5-08 | Success page does not claim historical orders | Visit success page with account query params | No hidden linking/claim behavior occurs |

## Regression Checks

- Storefront routes outside account/checkout remain unaffected.
- Admin auth and admin routes remain unaffected.
- Public order tracking payload stays minimal.
- Checkout success JSON body shape remains unchanged.
- No provider/internal error strings are leaked to customer auth forms.
- Rate-limit responses remain deterministic and include `requestId`.

## Sign-off Criteria

- All B1-B5 scenarios above pass on staging.
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass on release candidate.
- No migration drift is reported before deploy.
- Product owner validates customer-facing copy and non-blocking checkout behavior.
