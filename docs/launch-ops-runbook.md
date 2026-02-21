# Launch Ops Runbook

## 1) Pre-Deploy Gate

- Ensure `pnpm check:preflight` passes locally.
- Confirm GitHub Actions `CI` workflow is green on the target branch.
- Verify `.env` in production includes all required variables from `.env.example`.
- Verify Supabase DB connectivity via `GET /api/health/ready`.
- Confirm secrets rotation if any key/password was exposed in logs/chat/history.
- Confirm deploy target (Vercel) has all required environment variables set for Production.

## 2) Health Checks

- Readiness endpoint: `GET /api/health/ready`
  - Success: HTTP `200` with `{ ok: true }`
  - Failure: HTTP `503` with database failure details
- DB info endpoint: `GET /api/health/db`
  - Use for quick sanity checks during incident triage.

## 3) Logging + Audit Signals

- Error logs are structured JSON via `routeErrorResponse`.
- Security logs include `security.rate_limited` events.
- Commerce logs include:
  - `order.checkout_created`
  - `admin.order_status_updated`
- Include `requestId` in incident tickets to correlate client errors with server logs.

## 4) Supabase Backup and Restore Routine

### Backup frequency

- Daily automated logical backup (minimum).
- Pre-release backup before major schema/data changes.

### Backup method

- Paid plan:
  - Use Supabase scheduled backups.
- Free plan:
  - Run manual logical backups from a trusted machine before high-risk releases.
- External logical backup command:

```bash
pg_dump "$DIRECT_URL" --format=custom --file=backup-YYYYMMDD.dump
```

### Restore drill (staging first)

```bash
pg_restore --clean --if-exists --no-owner --dbname "$DIRECT_URL" backup-YYYYMMDD.dump
```

- After restore: run `pnpm prisma:generate`, smoke test API, then validate checkout and admin order update flows.

## 5) Rollback Procedure

1. Identify bad deployment commit SHA.
2. Re-deploy previous known-good commit.
3. If needed, restore DB from latest valid backup to staging first, then production.
4. Run smoke checks:
   - `/api/health/ready`
   - Customer: add to cart -> checkout
   - Admin: login -> update order status

## 6) Incident Checklist

1. Confirm severity and scope (checkout down, admin down, partial degradation).
2. Check readiness endpoint and DB status first.
3. Inspect structured logs by `requestId`.
4. Mitigate:
   - Roll back application build if code regression.
   - Restore DB if data corruption.
5. Document:
   - Root cause
   - Impact window
   - Corrective actions

## 7) Repository Guardrails

- Enable branch protection on `master`:
  - Require pull request before merge
  - Require `CI` status check to pass
  - Disable force pushes
- Keep direct commits to `master` disabled.

## 8) Vercel Deployment Notes

- Build command: `pnpm run build`
- Ensure `DIRECT_URL` is configured in Vercel env (required by `pnpm prisma:generate`).
- If deployment fails with type errors, fix in branch and redeploy via PR merge.
- After successful deployment, smoke test:
  - `/`
  - `/search?q=test`
  - `/cart`
  - `/checkout`
  - `/order/track`
  - `/admin/login`

## 9) Payment Proof Storage Model

- Upload endpoints:
  - `POST /api/checkout/payment-proof/sign` (signed PUT URL)
  - `POST /api/checkout/payment-proof/upload` (server-side fallback upload)
- Input validation:
  - MIME: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
  - Max file size: `8 MB`
  - Invalid payload returns explicit error codes (`FILE_REQUIRED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`).
- Storage path format:
  - `payment-proofs/YYYY-MM-DD/{guestToken}/{uuid}.{ext}`
- Access model:
  - Objects are stored with no-cache private headers (`private, max-age=0, no-store`).
  - URLs use opaque random keys and are only submitted from checkout payloads.
  - Admin verification must rely on order-linked proof URLs; do not expose proof URLs in public storefront APIs.
