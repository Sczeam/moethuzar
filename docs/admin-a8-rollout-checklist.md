# Admin A8 Rollout Checklist

Last updated: 2026-03-03

## Pre-PR

- [x] Identify affected admin routes/components.
- [x] Update/confirm entries in `docs/admin-a8-qa-matrix.md`.
- [x] Confirm any new control uses `ADMIN_A11Y` target and focus primitives.
- [x] Confirm any new status/notice uses `lib/admin/state-clarity.ts`.

## PR Validation

- [x] `pnpm -s tsc --noEmit`
- [x] `pnpm -s lint`
- [x] `pnpm -s admin:a11y:smoke`
- [x] Route checks completed for changed routes in QA matrix.
- [x] Include evidence (screenshots/video) for keyboard/focus/dialog behavior where changed.

## Post-Merge

- [x] Quick manual smoke on production-like environment for changed routes.
- [x] If regressions found, open blocking bug with route + reproduction steps.
- [x] Update A8 matrix/checklist docs when new admin route/module is introduced.

## Ownership

- Primary: frontend engineer implementing admin changes.
- Secondary: reviewer validates matrix and CI guardrail output.

## A8.7 Completion Note (2026-03-03)

- Completed rollout chain:
  - `#205` via PR `#207`
  - `#204` via PR `#208`
  - `#206` via PR `#209`
  - `#203` closeout in this PR
- Outcome:
  - Admin semantic-state consistency rollout (`#201`) is complete and ready for closure after merge.

