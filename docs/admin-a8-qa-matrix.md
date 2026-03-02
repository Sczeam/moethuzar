# Admin A8 QA Matrix

Last updated: 2026-03-02

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
| `/admin` |  |  |  | N/A |  | N/A |
| `/admin/orders` |  |  |  | N/A |  |  |
| `/admin/orders/[orderId]` |  |  |  |  |  |  |
| `/admin/catalog` |  |  |  |  |  |  |
| `/admin/catalog/new` |  |  |  |  |  |  |
| `/admin/shipping-rules` |  |  |  | N/A |  |  |
| `/admin/payment-transfer-methods` |  |  |  | N/A |  |  |
| `/admin/login` |  |  |  | N/A |  |  |
| `/admin/unauthorized` |  |  |  | N/A |  | N/A |

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

