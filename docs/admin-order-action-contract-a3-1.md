# A3.1 Spec: Admin Order Action Model + Copy Contract

Issue: `#116`  
Parent: `#77`

## Goal

Define a deterministic action contract for admin order detail that:

- exposes only valid actions for the current state
- surfaces one recommended next action
- provides plain-language blocked reasons and confirmations
- stays stable as backend/frontend evolve

This is a **contract/spec layer** only. No route behavior changes are introduced in A3.1.

## Action IDs

- `payment.verify`
- `payment.reject`
- `status.confirm`
- `status.mark_delivering`
- `status.mark_delivered`
- `status.cancel`

## Contract Shape

```ts
type OrderActionContract = {
  allowedActions: OrderActionId[];
  recommendedAction: OrderActionId | null;
  blockedActions: Array<{
    actionId: OrderActionId;
    reasonKey: CopyKey;
  }>;
};
```

Source implementation: `server/domain/admin-order-action-contract.ts`

## Transition Baseline (Status)

Status transitions follow current workflow rules:

- `PENDING -> CONFIRMED | CANCELLED`
- `CONFIRMED -> DELIVERING | CANCELLED`
- `DELIVERING -> DELIVERED | CANCELLED`
- `DELIVERED -> (none)`
- `CANCELLED -> (none)`

## Payment Review Baseline

Payment review actions are available only when all are true:

1. payment method is `PREPAID_TRANSFER`
2. payment proof exists
3. payment status is `PENDING_REVIEW`

Otherwise, payment actions are blocked with reason keys:

- `blocked.payment.not_prepaid_transfer`
- `blocked.payment.proof_missing`
- `blocked.payment.review_not_pending`

## Recommended Action Rules

Priority order:

1. payment review path (`payment.verify`) when payment is pending review
2. first valid status progression action for current order status
3. `null` if no valid action exists (terminal states)

## Copy Contract (Keys)

### Action labels

- `action.payment.verify`
- `action.payment.reject`
- `action.status.confirm`
- `action.status.mark_delivering`
- `action.status.mark_delivered`
- `action.status.cancel`

### Confirmation copy

- `confirm.payment.verify.title` / `confirm.payment.verify.body`
- `confirm.payment.reject.title` / `confirm.payment.reject.body`
- `confirm.status.confirm.title` / `confirm.status.confirm.body`
- `confirm.status.mark_delivering.title` / `confirm.status.mark_delivering.body`
- `confirm.status.mark_delivered.title` / `confirm.status.mark_delivered.body`
- `confirm.status.cancel.title` / `confirm.status.cancel.body`

### Blocked reasons

- `blocked.payment.not_prepaid_transfer`
- `blocked.payment.proof_missing`
- `blocked.payment.review_not_pending`
- `blocked.status.transition_invalid`
- `blocked.status.already_terminal`

### Success and fallback errors

- `success.payment.verified`
- `success.payment.rejected`
- `success.status.confirmed`
- `success.status.delivering`
- `success.status.delivered`
- `success.status.cancelled`
- `error.action.generic`
- `error.action.invalid_transition`

## Sample Cases

### Case A: Prepaid + pending review + status pending

Allowed:
- `payment.verify`
- `payment.reject`
- `status.confirm`
- `status.cancel`

Recommended:
- `payment.verify`

### Case B: COD + status pending

Allowed:
- `status.confirm`
- `status.cancel`

Blocked payment review:
- `payment.verify` -> `blocked.payment.not_prepaid_transfer`
- `payment.reject` -> `blocked.payment.not_prepaid_transfer`

### Case C: Prepaid verified + status confirmed

Allowed:
- `status.mark_delivering`
- `status.cancel`

Recommended:
- `status.mark_delivering`

### Case D: Delivered terminal state

Allowed:
- none

Recommended:
- `null`

Blocked status actions:
- all status actions -> `blocked.status.already_terminal`

## SOLID Mapping

- **SRP**: transition/copy contract is isolated in one domain module.
- **OCP**: adding new actions/statuses extends mapping tables without rewriting consumers.
- **ISP**: frontend consumes a small action-state payload, not raw persistence logic.
- **DIP**: UI and routes can depend on this contract abstraction rather than hard-coded conditionals.

## Next Step

`#114` implements backend guardrails + stable action-state payload on top of this contract.
