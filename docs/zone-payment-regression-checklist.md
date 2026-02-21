# Zone Payment Regression Checklist

Last updated: 2026-02-21

Use this checklist before merging or deploying zone-payment changes.

## A) Preflight

- [ ] `pnpm check:preflight` passes
- [ ] Prisma client generated successfully
- [ ] No pending migrations in target environment

## B) Storefront Regression

- [ ] Home page loads without hydration errors
- [ ] Product listing and PDP render correctly
- [ ] Add to cart / update quantity / remove item work
- [ ] Cart totals are correct
- [ ] Search route works and returns expected products

## C) Checkout Regression (Core)

- [ ] Yangon address => COD flow works
- [ ] Non-Yangon address => prepaid flow appears
- [ ] Prepaid requires transfer method + proof upload
- [ ] Upload validation messages are clear
- [ ] Order submission returns order success page

## D) Order Tracking

- [ ] `/order/success/[orderCode]` shows created order
- [ ] `/order/track` can find order by code
- [ ] Invalid code path returns stable "not found" response

## E) Admin Regression

- [ ] Admin login/auth works
- [ ] `/admin/orders` loads and paginates
- [ ] Order status filter still works
- [ ] Payment status filter works
- [ ] CSV export works with both status and paymentStatus filters
- [ ] `/admin/orders/[orderId]` payment section renders correctly
- [ ] Verify payment action works for pending prepaid orders
- [ ] Reject payment action works for pending prepaid orders
- [ ] Resolved payment states disable further review actions

## F) Transfer Methods / Shipping

- [ ] `/admin/payment-transfer-methods` CRUD works
- [ ] Checkout receives active transfer methods
- [ ] `/admin/shipping-rules` unaffected by payment updates

## G) Logging / Observability

- [ ] `order.checkout_created` includes payment fields
- [ ] `admin.order_payment_reviewed` emitted on decision
- [ ] `payment.review_hook_enqueued` emitted for hooks
- [ ] Error payloads include `requestId`

## H) Manual Sign-Off

- Tester:
- Date:
- Branch / Commit:
- Environment:
- Result: PASS / FAIL
- Notes:

