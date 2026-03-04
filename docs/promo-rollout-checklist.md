# Promo Rollout + Rollback Checklist (C5.4)

Last updated: 4 March 2026

## 1) Scope

Use this checklist when releasing promo engine changes:

- Checkout promo preview/apply flow (`POST /api/checkout/promo`)
- Admin promo CRUD/toggle (`/admin/promotions`, `/api/admin/promos*`)
- Promo observability events (`docs/promo-observability-contract.md`)

## 2) Preconditions (Release Gate)

- Branch merged through PR with green CI.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:preflight` all pass.
- No pending migration drift:
  - `pnpm prisma:generate`
  - `pnpm prisma:migrate status`
- Production env vars present and unchanged unexpectedly:
  - DB URLs
  - Supabase vars
  - admin auth vars
- `GET /api/health/ready` returns `200` on current production before deploy.

## 3) Deploy Sequence

1. Confirm release SHA and owner-on-call.
2. Deploy application build.
3. Verify readiness endpoint:
   - `GET /api/health/ready` => `200`.
4. Verify admin authentication:
   - `/admin/login` reachable
   - `/api/admin/auth/me` works for admin.
5. Verify promo admin page:
   - `/admin/promotions` loads list.

## 4) Promo Smoke Matrix (Must Pass)

### Admin flow

- Create promo code (active, valid window) -> appears in table.
- Update promo label/value -> persists correctly.
- Toggle active -> status changes and API returns success.

### Checkout flow

- Valid promo:
  - preview succeeds
  - returns discount amount and after-discount subtotal.
- Invalid promo code:
  - returns deterministic `PROMO_INVALID_CODE`.
- Inactive promo:
  - returns deterministic `PROMO_NOT_ACTIVE`.
- Scheduled promo (starts in future):
  - returns deterministic `PROMO_NOT_STARTED`.
- Expired promo:
  - returns deterministic `PROMO_EXPIRED`.
- Minimum subtotal not met:
  - returns deterministic `PROMO_MIN_ORDER_NOT_MET`.
- Usage cap reached:
  - returns deterministic `PROMO_USAGE_LIMIT_REACHED`.

### Observability flow

Confirm expected events in logs:

- `promo.preview_succeeded`
- `promo.preview_rejected`
- `promo.reservation_conflict` (if race/conflict simulated)
- `admin.promo_created`
- `admin.promo_updated`
- `admin.promo_toggled`

Use `requestId` to correlate request errors and logs.

## 5) Rollback Procedure

### App-only rollback (preferred first)

1. Redeploy previous known-good commit SHA.
2. Re-run smoke checks:
   - `/api/health/ready`
   - `/admin/promotions`
   - `POST /api/checkout/promo` (valid + invalid code)
3. Verify errors and logs return to baseline.

### Data rollback (only if data corruption)

1. Restore from latest validated backup to staging first.
2. Validate promo/admin/checkout smoke matrix on staging.
3. Execute controlled production restore.
4. Re-run smoke matrix.

## 6) Incident Triage

### Signal source

- `api.route_error` structured errors with `requestId`
- promo observability events from contract doc

### Fast checks

1. Is `/api/health/ready` healthy?
2. Is issue admin-only, checkout-only, or both?
3. Are errors deterministic (`PROMO_*`) or infrastructure-level?

### Common failure patterns

- `SCHEMA_NOT_SYNCED`: migration/state mismatch.
- `PROMO_INVALID_CODE` spikes: support or UX issue in promo entry.
- `PROMO_USAGE_LIMIT_REACHED` early: usage cap too low.
- `promo.reservation_conflict` spikes: traffic/race pattern, review reservation logic and retry posture.

## 7) Support Checklist

Use this for customer/admin-facing support:

1. Collect:
   - timestamp
   - promo code entered
   - request ID (if available)
   - screenshot of checkout/admin screen
2. Reproduce with the same subtotal/cart state.
3. Map rejection code to response:
   - invalid/inactive/scheduled/expired/min order/usage cap
4. If system regression suspected:
   - escalate with requestId + event log excerpt.
5. If configuration issue:
   - adjust promo in admin and re-test.

## 8) Exit Criteria

- Smoke matrix passed.
- Observability events confirmed.
- Rollback steps validated by owner-on-call.
- Issue #224 can be closed with evidence links.

