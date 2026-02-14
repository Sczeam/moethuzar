# MVP QA Checklist

## Customer Flow

- Browse products at `/` and open a product detail page.
- Add an in-stock variant to cart and verify quantity updates.
- Checkout with valid Myanmar address fields and place order.
- Confirm redirect to `/order/success/[orderCode]`.
- Use `Refresh Status` on success page and verify no error.
- Copy order code and open `/order/track` to fetch the same order.
- Attempt checkout with insufficient stock and verify clear error.

## Admin Flow

- Login at `/admin/login` with mapped admin account.
- Verify order list loads and status filter works.
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
- Verify CI is green (`lint`, `test`, `build`) before merge to `master`.
