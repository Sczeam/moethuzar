# Account Orders Rollout Checklist

Last updated: 7 March 2026

## Scope

Use this checklist when releasing or validating the Phase B customer account and order-history stack:

- customer auth routes and middleware
- account landing + My Orders
- signed-in checkout ownership linking
- checkout/success-page account creation nudges
- B5 historical backfill tooling

## Preconditions

- Release branch merged through PR with green CI
- `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass on the release SHA
- Prisma schema is synchronized:
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate status`
- Supabase Auth environment variables are present and unchanged unexpectedly
- Database readiness is healthy:
  - `GET /api/health/ready` returns `200`

## Deploy Sequence

1. Confirm release SHA and owner-on-call.
2. Deploy the application build.
3. Verify readiness:
   - `GET /api/health/ready` => `200`
4. Verify public customer auth routes:
   - `/account/login`
   - `/account/register`
   - `/account/forgot-password`
   - `/account/reset-password`
5. Verify protected account routes redirect correctly when signed out:
   - `/account`
   - `/account/orders`
6. Verify signed-in account routes render correctly.
7. Verify guest checkout still loads and submits.

## Smoke Checks

### Customer auth

- Register a new customer account.
- Sign out, then sign back in with the same account.
- Trigger forgot-password flow.
- Complete password reset flow.
- Confirm `GET /api/account/auth/me` returns a minimal `no-store` session payload.

### My Orders

- Place one order while signed in.
- Verify the order appears in `/account/orders`.
- Verify pagination behaves correctly if more than one page exists.
- Verify one account cannot see another customer's orders.

### Guest checkout safety

- Place one order while signed out.
- Verify checkout succeeds with no forced auth flow.
- Verify the order is not shown inside a customer account unless it was created while signed in.

### Checkout account nudges

- Guest checkout with account opt-in off:
  - order succeeds
  - success page shows generic account CTA
- Guest checkout with account opt-in on and a fresh email:
  - order succeeds
  - success page shows sign-in CTA for created account
- Guest checkout with account opt-in on and an existing email:
  - order succeeds
  - success page shows sign-in + reset CTA

### B5 operational tooling

- Run dry-run:
  - `pnpm ops:backfill-customer-orders`
- Review artifact under:
  - `.ops-reports/customer-order-backfill/`
- Confirm apply mode is guarded by:
  - `--confirm "LINK ORDERS"`
- Confirm rollback command is documented:
  - `pnpm ops:rollback-customer-order-backfill --run-id <run-id> --confirm "LINK ORDERS"`

## Observability Checks

Confirm the following signals are present and usable:

- `api.route_error` includes `requestId`
- `checkout.customer_identity_degraded`
- `checkout.account_intent_degraded`
- customer auth failures expose stable `reasonCode`

Do not expect PII dumps in logs.

## Rollback / Recovery

### App rollback

1. Redeploy the previous known-good commit SHA.
2. Re-run:
   - `/api/health/ready`
   - `/account/login`
   - `/account/register`
   - `/checkout`
3. Verify guest checkout and admin routes are back to baseline.

### Schema safety note

Phase B schema changes are additive-only:

- `Customer` table
- nullable `Order.customerId`

Rollback is app-safe as long as deployed code does not assume every order has a customer.

### Historical linking rollback

If B5 backfill was executed:

1. Identify the `runId` from the apply artifact.
2. Run:
   - `pnpm ops:rollback-customer-order-backfill --run-id <run-id> --confirm "LINK ORDERS"`
3. Review the rollback artifact written beside the apply artifact.

## Support Notes

When a customer says "I was signed in but my order is missing":

1. Collect:
   - timestamp
   - order code
   - email used at checkout
   - request ID if available
2. Determine whether the order was created:
   - under a signed-in session
   - as a guest with later sign-in
3. If the order was guest-created, do not infer ownership automatically.
4. Use B5 only for the controlled historical backfill workflow, not ad hoc claims.

## Exit Criteria

- Verification report `docs/account-orders-verification-report.md` is complete.
- Guest checkout is confirmed unchanged.
- Signed-in checkout order linking is confirmed.
- Account opt-in/success CTAs behave as designed.
- B5 dry-run/apply/rollback commands are documented and reproducible.
