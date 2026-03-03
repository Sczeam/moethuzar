# Phase C Promotion Spec (Frozen)

Last updated: 3 March 2026

## Purpose
Define non-negotiable promotion math and policy before checkout/API integration.

## C0 Freeze Decisions

### 1) Discount scope
- Promo discount applies to **order subtotal only**.
- Shipping fee is calculated after subtotal discount and is never discounted by promo in v1.

### 2) Currency and rounding
- Promo math is evaluated in **MMK integer units**.
- Percent discount formula:
  - `discountAmount = floor(subtotalAmount * percent / 100)`
- Flat discount formula:
  - `discountAmount = min(flatAmount, subtotalAmount)`
- Post-discount clamp:
  - `subtotalAfterDiscount = max(0, subtotalAmount - discountAmount)`

### 3) Eligibility order (deterministic)
Validation order is fixed and must stay stable:
1. code normalization + non-empty check
2. promo active check
3. start window check
4. end window check
5. usage cap check
6. minimum subtotal check
7. discount configuration sanity check

### 4) Code normalization policy
- Normalize promo code with:
  - trim leading/trailing spaces
  - uppercase
  - remove internal whitespace
- Allowed characters:
  - letters, numbers, `_`, `-`

### 5) Usage cap policy
- Usage is counted when promo is accepted at checkout and order is created.
- C1 engine checks against provided `usageCount` snapshot.
- Cancellation/reversal behavior:
  - **deferred to C2/C4 implementation policy** (default v1: no automatic decrement on cancellation unless explicitly implemented).

### 6) Abuse/rate-limit baseline policy
- C1 engine is pure and stateless.
- API-level abuse guardrails (apply attempts per token/IP) are handled in later phases (C2/C5).
- C1 returns explicit deterministic rejection codes for safe throttling/reporting upstream.

### 7) Rollout / rollback policy
- Rollout:
  1. C1 schema + pure engine + tests
  2. C2 checkout integration (feature-flagged if needed)
- Rollback:
  - disable promo usage at API layer
  - keep schema additive and safe (no destructive rollback required)

## Rejection Code Contract (C1)
- `PROMO_INVALID_CODE`
- `PROMO_INACTIVE`
- `PROMO_NOT_STARTED`
- `PROMO_EXPIRED`
- `PROMO_MIN_ORDER_NOT_MET`
- `PROMO_USAGE_LIMIT_REACHED`
- `PROMO_INVALID_CONFIG`

## Order Snapshot Contract (C1)
Orders persist promo snapshot fields:
- `promoCode`
- `promoDiscountType`
- `promoDiscountValue`
- `discountAmount`
- `subtotalBeforeDiscount`
- `subtotalAfterDiscount`

This guarantees auditable totals even if promo definition changes later.
