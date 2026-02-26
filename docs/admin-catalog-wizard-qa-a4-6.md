# Admin Catalog Wizard QA (A4.6)

Scope: `app/admin/catalog/catalog-client.tsx` review step and submit orchestration.

## Checks

- Create flow:
  - Fill basics, media, variants.
  - Review shows grouped cards: Basic Info, Media, Variants.
  - `Jump to fix` moves to target step.
  - `Save Draft` creates with `DRAFT` status.
  - `Publish` creates with `ACTIVE` status.

- Edit flow:
  - Open existing product.
  - Review shows current snapshot.
  - `Save Draft` updates with `DRAFT` status.
  - `Publish` updates with `ACTIVE` status.

- Validation mapping:
  - If server draft validation fails with variant issue, current step moves to `VARIANTS`.
  - If server returns image issue, step moves to `IMAGES`.
  - If server returns basic field issue, step moves to `BASICS`.

- Regressions:
  - Media upload queue works.
  - Variant matrix and bulk actions still work.
  - Inline category creation still works.

## Local validation

- `pnpm lint` (no new errors; one pre-existing warning in `app/admin/orders/[orderId]/page.tsx`)
- `pnpm typecheck`
