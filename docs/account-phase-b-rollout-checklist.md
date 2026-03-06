# Phase B Rollout Checklist

Last updated: 6 March 2026

## 1) Scope

Use this checklist when releasing Phase B customer-account work:

- Customer auth routes and middleware
- Customer account dashboard + My Orders
- Checkout signed-in order linking
- Checkout/success-page account creation nudges

## 2) Preconditions

- Branch merged through PR with green CI.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` pass on release SHA.
- Prisma schema is synced:
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate status`
- Supabase Auth env vars are present and unchanged unexpectedly.
- Database connectivity and readiness are healthy:
  - `GET /api/health/ready` returns `200`

## 3) Deploy Sequence

1. Confirm release SHA and owner-on-call.
2. Deploy application build.
3. Verify readiness:
   - `GET /api/health/ready` => `200`
4. Verify storefront auth pages:
   - `/account/login`
   - `/account/register`
   - `/account/forgot-password`
5. Verify protected account routes redirect correctly when signed out:
   - `/account`
   - `/account/orders`
6. Verify signed-in account routes render correctly.
7. Verify checkout still loads for guests.

## 4) Smoke Checks

### Customer auth

- Register a new customer account.
- Sign out, then sign back in with the same account.
- Trigger forgot-password flow.
- Complete password reset flow.
- Confirm `/api/account/auth/me` returns minimal session payload.

### My Orders

- Place one order while signed in.
- Verify the order appears in `/account/orders`.
- Verify list pagination still behaves correctly if more than one page exists.

### Guest checkout safety

- Place one order while signed out.
- Verify checkout succeeds with no forced auth flow.
- Verify the order does not appear in a customer account unless it was created under a signed-in session.

### Checkout account nudges

- Signed-out checkout with account opt-in off:
  - order succeeds
  - success page shows generic account CTA
- Signed-out checkout with account opt-in on and fresh email:
  - order succeeds
  - success page shows sign-in CTA for created account
- Signed-out checkout with account opt-in on and existing email:
  - order succeeds
  - success page shows sign-in + reset CTA

## 5) Observability Checks

Confirm the following signals exist and look sane:

- `api.route_error` includes `requestId`
- `checkout.customer_identity_degraded`
- `checkout.account_intent_degraded`
- customer auth failure events with stable `reasonCode`

Do not expect PII dumps in logs.

## 6) Rollback / Recovery

### App rollback

1. Redeploy previous known-good commit SHA.
2. Re-run:
   - `/api/health/ready`
   - `/account/login`
   - `/account/register`
   - `/checkout`
3. Verify guest checkout and admin routes are back to baseline.

### Migration safety note

Phase B schema changes are additive-only:
- `Customer` table
- nullable `Order.customerId`

Rollback is app-safe as long as deployed code does not assume every order has a customer.

## 7) Incident Triage

### Common failure patterns

- Login/register/reset pages render but actions fail:
  - check Supabase env and auth reachability
- Signed-in checkout not linked:
  - inspect `checkout.customer_identity_degraded`
- Account opt-in fails but order succeeds:
  - inspect `checkout.account_intent_degraded`
- My Orders empty unexpectedly:
  - confirm session is valid
  - confirm order was created under signed-in session, not guest

### Fast checks

1. Is readiness healthy?
2. Is the issue auth-only, checkout-only, or account-orders-only?
3. Does the log contain a `requestId` and stable reason code?

## 8) Support Notes

When a customer says “I was signed in but my order is missing”:

1. Collect:
   - timestamp
   - order code
   - email used at checkout
   - request ID if available
2. Determine whether the order was created:
   - under signed-in session
   - as guest with later sign-in
3. If guest-created, do not manually infer ownership without a verified support flow.

## 9) Exit Criteria

- QA matrix `docs/account-phase-b-qa-matrix.md` is fully verified.
- Guest checkout is confirmed unchanged.
- Signed-in checkout order linking is confirmed.
- Account opt-in/success CTAs behave as designed.
- Issue `#254` is ready for closure with evidence links.
