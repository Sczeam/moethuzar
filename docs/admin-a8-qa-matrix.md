# Admin A8 QA Matrix

Last updated: 2026-03-03

Purpose: repeatable accessibility verification for admin routes after UX or component changes.

## Scope

- `/admin` (dashboard)
- `/admin/orders`
- `/admin/orders/[orderId]`
- `/admin/catalog`
- `/admin/catalog/new`
- `/admin/shipping-rules`
- `/admin/payment-transfer-methods`
- `/admin/login`
- `/admin/unauthorized`

## Verification Matrix

Use `Pass / Fail / N/A` per row. Fail blocks merge.

| Route | Keyboard path (tab order) | Focus visible | Min target size | Dialog trap/ESC/restore | Contrast + state clarity | Live region / field error semantics |
|---|---|---|---|---|---|---|
| `/admin` | Pass | Pass | Pass | N/A | Pass | N/A |
| `/admin/orders` | Pass | Pass | Pass | N/A | Pass | Pass |
| `/admin/orders/[orderId]` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/admin/catalog` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/admin/catalog/new` | Pass | Pass | Pass | Pass | Pass | Pass |
| `/admin/shipping-rules` | Pass | Pass | Pass | N/A | Pass | Pass |
| `/admin/payment-transfer-methods` | Pass | Pass | Pass | N/A | Pass | Pass |
| `/admin/login` | Pass | Pass | Pass | N/A | Pass | Pass |
| `/admin/unauthorized` | Pass | Pass | Pass | N/A | Pass | N/A |

## Route-Level Checks

1. Keyboard path:
- No trapped focus outside intentional dialogs.
- Actionable controls reachable in visual order.

2. Focus visible:
- Focus ring visible on links/buttons/inputs.
- Ring is not clipped by container overflow.

3. Target size:
- `ADMIN_A11Y.target.minInteractive` or `compactInteractive` used on compact controls.

4. Dialog behavior (where applicable):
- `role="dialog"` + `aria-modal="true"`.
- Focus trap cycles inside dialog.
- `Escape` closes dialog.
- Focus restores to trigger element.

5. Contrast and state clarity:
- Status/notice surfaces use semantic helpers from `lib/admin/state-clarity.ts`.
- Disabled/active/selected states are not color-only (include structural/ARIA cue).

6. Error/status semantics:
- Use `adminLiveRegionProps` for feedback messages.
- Use `adminFieldA11y` for field error associations where inputs have validation errors.

## A8.7 Closeout Evidence (2026-03-03)

- Semantic rollout PRs:
  - `#207` (`#205`) Catalog semantic-state rollout.
  - `#208` (`#204`) Wizard/Dashboard/Sidebar semantic-state rollout.
  - `#209` (`#206`) Auth semantic-state rollout.
- Guardrails executed:
  - `pnpm -s admin:a11y:smoke` -> pass
  - `pnpm -s tsc --noEmit` -> pass
  - `pnpm -s lint` -> pass

