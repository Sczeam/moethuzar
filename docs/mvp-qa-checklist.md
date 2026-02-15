# MVP QA Checklist

## Customer Flow

- Browse products at `/` and open a product detail page.
- Verify hero section fills viewport and nav rail behavior is correct on desktop/mobile.
- Add an in-stock variant to cart and verify quantity updates.
- Checkout with valid Myanmar address fields and place order.
- Confirm checkout blocks submission until Terms + Privacy checkbox is checked.
- Confirm redirect to `/order/success/[orderCode]`.
- Use `Refresh Status` on success page and verify no error.
- Copy order code and open `/order/track` to fetch the same order.
- Attempt checkout with insufficient stock and verify clear error.
- Use header search icon, submit query, and verify `/search` results/pagination.

## Admin Flow

- Login at `/admin/login` with mapped admin account.
- Verify order list loads and status filter works.
- Verify order search/date-range filters and CSV export from admin orders page.
- Open order detail and call/copy customer contact from page.
- Move status `PENDING -> CONFIRMED -> DELIVERING -> DELIVERED`.
- Create another order and cancel it with required note.
- Verify cancelled order shows status timeline entry.

## Reliability / Regression

- Place one order, then add new item again; ensure cart works after checkout.
- Trigger malformed cookie scenario (or stale browser cookies) and ensure cart still loads.
- Confirm API error responses include request ID in JSON when failures happen.

## Launch Readiness

- Confirm `/api/health/ready` returns `200` in deployed environment.
- Verify rate limiting works for checkout/order lookup/admin login (returns `429` on abuse).
- Verify legal pages are reachable: `/terms`, `/privacy`, `/returns`, `/contact`.
- Run `pnpm check:preflight` locally before release.
- Verify CI is green (`lint`, `typecheck`, `test`, `build`) before merge to `master`.
