# Account Order Backfill (B5)

This runbook covers the one-time historical order backfill for guest-era orders that should now be linked to `Customer` records.

## Scope

- Only historical orders created before the B3 customer-linking release boundary are in scope by default.
- Only orders with `customerId = null` are eligible.
- Matching is strict:
  - normalize email with `trim().toLowerCase()`
  - exact email match only
  - no name or phone heuristics
- Deactivated customers are skipped.
- Existing `customerId` links are never overwritten.

## Safety Rules

- Dry-run first. Apply only after reviewing the artifact.
- Apply mode requires the explicit confirmation string:
  - `LINK ORDERS`
- Artifacts are written to a gitignored local path:
  - `.ops-reports/customer-order-backfill/`
- Reports do not store raw email in committed docs. Local artifacts store masked email and email hash only.

## Dry Run

```bash
pnpm ops:backfill-customer-orders
```

Optional filters:

```bash
pnpm ops:backfill-customer-orders --before 2026-03-05T00:00:00.000Z
pnpm ops:backfill-customer-orders --limit 100
pnpm ops:backfill-customer-orders --order-code MZT-20260301-ABC123
pnpm ops:backfill-customer-orders --customer-email customer@example.com
```

Review:

- summary counts
- skipped reasons
- dry-run artifact in `.ops-reports/customer-order-backfill/`

## Apply

```bash
pnpm ops:backfill-customer-orders --apply --confirm "LINK ORDERS"
```

The script prints:

- database host
- database name
- cutoff date
- summary table
- artifact path

The apply artifact includes:

- `runId`
- `timestamp`
- `orderId`
- `orderCode`
- `previousCustomerId`
- `newCustomerId`
- masked email
- email hash

## Rollback

Rollback restores `customerId` to the previous value recorded in the apply artifact for a specific `runId`.

```bash
pnpm ops:rollback-customer-order-backfill --run-id <run-id> --confirm "LINK ORDERS"
```

Rollback is defensive:

- skips missing orders
- skips rows where current `customerId` no longer matches the artifact `newCustomerId`
- writes a rollback artifact beside the apply artifact

## Expected Skip Reasons

- `skippedNoEmail`
- `skippedNoCustomerMatch`
- `skippedAlreadyLinked`
- `skippedDeactivatedCustomer`
- `skippedAmbiguous`

## Notes

- The default cutoff is locked in code at `2026-03-05T00:00:00.000Z`.
- This is an operational script, not a deploy migration.
- Re-running is safe because only unlinked orders are updated.
