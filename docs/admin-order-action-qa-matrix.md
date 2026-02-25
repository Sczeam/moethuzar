# Admin Order Action QA Matrix (A3.5)

Last updated: 2026-02-25

## Scope

- Guided action system on `/admin/orders/[orderId]`
- Contract source: `server/domain/admin-order-action-contract.ts`
- UI surface: `app/admin/orders/[orderId]/page.tsx`

## Matrix: Allowed/Recommended/Blocked

| ID | Order Status | Payment Method | Payment Status | Payment Proof | Expected Allowed Actions | Expected Recommended | Expected Blocked Highlights |
|---|---|---|---|---|---|---|---|
| OA-01 | `PENDING` | `COD` | `NOT_REQUIRED` | `false` | `status.confirm`, `status.cancel` | `status.confirm` | Payment actions blocked: `blocked.payment.not_prepaid_transfer` |
| OA-02 | `PENDING` | `PREPAID_TRANSFER` | `PENDING_REVIEW` | `false` | `status.confirm`, `status.cancel` | `status.confirm` | Payment actions blocked: `blocked.payment.proof_missing` |
| OA-03 | `PENDING` | `PREPAID_TRANSFER` | `PENDING_REVIEW` | `true` | `payment.verify`, `payment.reject`, `status.confirm`, `status.cancel` | `payment.verify` | none |
| OA-04 | `CONFIRMED` | `COD` | `NOT_REQUIRED` | `false` | `status.mark_delivering`, `status.cancel` | `status.mark_delivering` | Payment actions blocked: `blocked.payment.not_prepaid_transfer` |
| OA-05 | `DELIVERING` | `PREPAID_TRANSFER` | `VERIFIED` | `true` | `status.mark_delivered`, `status.cancel` | `status.mark_delivered` | Payment actions blocked: `blocked.payment.review_not_pending` |
| OA-06 | `DELIVERED` | `COD` | `NOT_REQUIRED` | `false` | none | none | Status actions blocked: `blocked.status.already_terminal` |
| OA-07 | `CANCELLED` | `PREPAID_TRANSFER` | `VERIFIED` | `true` | none | none | Status actions blocked: `blocked.status.already_terminal` |

## Guardrail Error Matrix

| ID | Trigger | API Code | Expected UI Behavior |
|---|---|---|---|
| OG-01 | Status changed in another session before confirm | `INVALID_ORDER_STATUS_TRANSITION` | Warning feedback + auto-refresh order + close modal |
| OG-02 | Payment reviewed elsewhere before action | `PAYMENT_REVIEW_NOT_PENDING` | Warning feedback + auto-refresh order + close modal |
| OG-03 | Proof removed/invalid for pending review | `PAYMENT_PROOF_MISSING` | Warning feedback + auto-refresh order + close modal |
| OG-04 | Invalid payload (e.g. empty required cancel note) | `VALIDATION_ERROR` | Error feedback, keep modal open, show inline correction path |
| OG-05 | Network/server transient failure | `INTERNAL_ERROR` or request failure | Error feedback with Retry action; retain entered note |

## Accessibility QA Checklist

### Modal interaction

- [ ] Dialog has `role="dialog"` and `aria-modal="true"`.
- [ ] Dialog has descriptive text bound via `aria-describedby`.
- [ ] `Esc` closes dialog only when action is not pending.
- [ ] Backdrop click closes dialog only when action is not pending.
- [ ] `Tab` and `Shift+Tab` cycle within modal focusable controls.
- [ ] Focus returns to action trigger after modal closes.

### Form semantics

- [ ] Note field sets `aria-invalid="true"` when validation fails.
- [ ] Validation message is exposed with `role="alert"` and `aria-describedby`.
- [ ] Confirm button enters loading+disabled state while request in flight.
- [ ] No duplicate submit is possible while request is pending.

### Feedback semantics

- [ ] Success/warning messages use `role="status"`.
- [ ] Error messages use `role="alert"`.
- [ ] Retry button appears only for retryable failures.

## Release Gate

- Matrix scenarios OA-01..OA-07 pass.
- Guardrail scenarios OG-01..OG-05 pass.
- Accessibility checklist fully checked.
- `pnpm vitest run server/domain/admin-order-action-contract.test.ts server/security/admin-order-action-feedback.test.ts server/security/admin-order-action-adapter.test.ts server/security/admin-order-route.test.ts server/security/admin-order-status-route.test.ts server/security/admin-order-payment-route.test.ts` passes.
- `pnpm typecheck` passes.
