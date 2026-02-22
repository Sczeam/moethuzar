# Phase C Promotion Engine Spec Checklist

Last updated: 2026-02-22

## Goal

Ship a deterministic promo engine that increases conversion without destabilizing checkout.

## C0 Spec Freeze (must be finalized before schema/API work)

- [ ] Discount applies to `subtotal` only (not shipping) in v1.
- [ ] Money math is integer MMK only across backend + frontend.
- [ ] Percent rounding rule is frozen: `floor` to nearest integer MMK.
- [ ] Final payable total is clamped at `>= 0`.
- [ ] Promo usage policy on cancellation is frozen:
  - [ ] v1 default: do not return usage count.
- [ ] Promo code normalization is frozen:
  - [ ] trim outer spaces
  - [ ] uppercase
  - [ ] remove internal spaces
- [ ] Abuse controls frozen:
  - [ ] promo apply endpoint rate-limited
  - [ ] no unlimited rapid retry loop from same client/session
- [ ] Rollout/rollback strategy frozen:
  - [ ] backend-safe rollout first
  - [ ] checkout still works if promo is absent/disabled

## C1 Data Model + Rule Engine

- [ ] Add `PromoCode` model with:
  - [ ] `codeNormalized` (unique)
  - [ ] `codeDisplay`
  - [ ] `type` (`FLAT`/`PERCENT`)
  - [ ] `value`
  - [ ] `minOrderAmount`
  - [ ] `startsAt`, `endsAt`
  - [ ] `usageLimit`, `usedCount`
  - [ ] `isActive`
- [ ] Add order promo snapshot fields:
  - [ ] `promoCode`
  - [ ] `promoType`
  - [ ] `promoValue`
  - [ ] `discountAmount`
- [ ] Add pure promo calculation/validation service:
  - [ ] deterministic output for `(subtotal, shipping, promo)`
  - [ ] explicit rejection reason enum/code mapping

## C2 Checkout API Integration (transaction-safe)

- [ ] Add promo validate/apply API contract.
- [ ] Revalidate promo server-side during checkout submit.
- [ ] Enforce usage-limit atomically in a DB transaction.
- [ ] Persist order promo snapshot only when promo is valid and applied.
- [ ] Return stable error codes:
  - [ ] `PROMO_INVALID`
  - [ ] `PROMO_EXPIRED`
  - [ ] `PROMO_NOT_STARTED`
  - [ ] `PROMO_USAGE_LIMIT`
  - [ ] `PROMO_MIN_ORDER_NOT_MET`

## C3 Checkout UX

- [ ] Add promo input with apply/remove.
- [ ] Show discount line item in summary.
- [ ] Recompute and display final total deterministically.
- [ ] Preserve promo behavior across quote/address updates.
- [ ] Show clear downgrade message if promo becomes invalid mid-flow.
- [ ] Keep zone-payment behavior unchanged (COD/prepaid proof rules still apply).

## C4 Admin Promo Management (basic CRUD)

- [ ] Promo list page with clear status chips:
  - [ ] scheduled
  - [ ] active
  - [ ] expired
  - [ ] inactive
  - [ ] exhausted
- [ ] Create/edit/toggle active state.
- [ ] Guardrails:
  - [ ] invalid window ranges blocked
  - [ ] invalid value/min order blocked
  - [ ] duplicate normalized code blocked
- [ ] Add lightweight preview calculator in admin form.

## C5 Tests + Observability + Rollout

- [ ] Unit tests for promo math and all rejection paths.
- [ ] Integration tests:
  - [ ] valid promo checkout
  - [ ] invalid promo checkout rejection
  - [ ] usage limit race-safe enforcement
- [ ] Structured events/logs:
  - [ ] `promo.apply_attempt`
  - [ ] `promo.apply_rejected`
  - [ ] `promo.applied_to_order`
- [ ] Run `pnpm check:preflight`.
- [ ] Deployment checklist updated in runbook.

## Acceptance Criteria

- [ ] Promo totals are deterministic and auditable.
- [ ] Invalid/expired/unavailable promos are rejected with actionable messages.
- [ ] Checkout remains stable for both Yangon COD and non-Yangon prepaid paths.
- [ ] Admin can create and manage promo campaigns without direct DB edits.
