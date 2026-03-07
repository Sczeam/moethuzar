# Account Orders Verification Report

Last updated: 7 March 2026

## Scope

This report is the Phase B verification gate for:

- B1 foundation: customer model, order ownership field, contracts
- B2 customer auth routes, middleware, server actions
- B3 checkout ownership linking
- B4 My Orders ownership-safe retrieval and pagination
- B5 historical backfill tooling
- B2 follow-up: account creation nudges during checkout and on success page

## Verification Evidence

### Static validation

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

### Key automated coverage already present in repo

- account orders service integration:
  - `server/services/account-orders.service.integration.test.ts`
- checkout ownership linking:
  - `server/security/checkout-route-customer-linking.test.ts`
- account orders route ownership + pagination:
  - `server/security/account-orders-route.test.ts`
- account me route session contract:
  - `server/security/account-me-route.test.ts`
- success-page account CTA behavior:
  - `server/security/order-success-page-account-cta.test.ts`
- B5 backfill tooling:
  - `server/ops/customer-order-backfill.test.ts`

## Verified Behaviors

### B1 Foundation

- `Customer` exists as a first-class domain model
- `Order.customerId` is nullable and additive
- guest checkout remains valid with `customerId = null`
- customer identity contracts and account order contracts are explicit

### B2 Customer Auth

- `/account/login` renders while signed out
- `/account/register` renders while signed out
- `/account/forgot-password` renders while signed out
- `/account/reset-password` renders while signed out
- `/account` and `/account/orders` redirect to login when signed out
- `next` path handling is sanitized to internal paths only
- logout is safe and idempotent
- `GET /api/account/auth/me` returns a minimal, `no-store` payload

### B3 Checkout Linking

- signed-in checkout writes `customerId` on first order creation
- guest checkout remains unlinked
- checkout never accepts client-supplied `customerId`
- identity resolution degradation does not block checkout
- idempotent replay does not mutate stored ownership

### B4 My Orders

- `/account/orders` only returns orders owned by the authenticated customer
- route and service use internal `Customer.id`, not Supabase auth id, for ownership queries
- cursor pagination is stable and ownership-safe
- list view stays summary-only and links safely to public tracking

### B2 Follow-up: Checkout/Success Nudges

- guest checkout can optionally request account creation
- account creation is non-blocking; order success remains primary
- existing-email collisions degrade to clear sign-in/reset guidance
- success-page CTA changes correctly by outcome:
  - signed in
  - account created during checkout
  - existing email already registered
  - generic guest fallback
- no silent historical claim/link occurs on success page

### B5 Historical Backfill Tooling

- dry-run mode exists and performs no writes
- apply mode requires explicit confirmation
- apply mode emits a local artifact with `runId`
- rollback mode restores links from the apply artifact by `runId`
- only unlinked, pre-cutoff, exact-email-match orders are eligible
- deactivated customers are skipped

## Known Boundaries

- Guest-created historical orders are not claimed automatically after the fact.
- Account success-page CTA does not mutate order ownership.
- Historical guest-order linking is a controlled operator workflow only (B5).

## Support / Incident Guidance

For "signed in but order missing" incidents:

1. verify whether checkout occurred under a signed-in session
2. inspect request-level logs and `requestId`
3. inspect `checkout.customer_identity_degraded` and `checkout.account_intent_degraded`
4. do not manually infer ownership for guest-created orders outside the approved workflow

## Release Gate

Phase B is ready to close when:

- the rollout checklist in `docs/account-orders-rollout-checklist.md` is completed
- the automated validations above pass on the release SHA
- manual guest + signed-in checkout smoke checks pass
- account orders ownership is confirmed in staging or production validation

## Conclusion

Phase B is implementation-complete and operationally documented.

Remaining work, if any, should be treated as future enhancements rather than blockers:

- richer account dashboard surfaces
- post-launch support tooling improvements
- stronger observability enrichment beyond current `requestId`/reason-code coverage
