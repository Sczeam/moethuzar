# Admin A8 Rollout Checklist

Last updated: 2026-03-02

## Pre-PR

- [ ] Identify affected admin routes/components.
- [ ] Update/confirm entries in `docs/admin-a8-qa-matrix.md`.
- [ ] Confirm any new control uses `ADMIN_A11Y` target and focus primitives.
- [ ] Confirm any new status/notice uses `lib/admin/state-clarity.ts`.

## PR Validation

- [ ] `pnpm -s tsc --noEmit`
- [ ] `pnpm -s lint`
- [ ] `pnpm -s admin:a11y:smoke`
- [ ] Route checks completed for changed routes in QA matrix.
- [ ] Include evidence (screenshots/video) for keyboard/focus/dialog behavior where changed.

## Post-Merge

- [ ] Quick manual smoke on production-like environment for changed routes.
- [ ] If regressions found, open blocking bug with route + reproduction steps.
- [ ] Update A8 matrix/checklist docs when new admin route/module is introduced.

## Ownership

- Primary: frontend engineer implementing admin changes.
- Secondary: reviewer validates matrix and CI guardrail output.

