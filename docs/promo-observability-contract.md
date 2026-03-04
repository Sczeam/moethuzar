# Promo Observability Contract

Last updated: 4 March 2026

## Goal
Define stable, structured promo telemetry fields for support/debug and lightweight analytics.

## PII policy
- Do not log customer name, phone, email, address, payment proof URLs.
- `promoCode` is allowed.
- `requestId` is allowed.

## Event taxonomy

### `promo.preview_succeeded`
Emitted when checkout promo preview succeeds.

Required fields:
- `event`
- `promoCode`
- `discountType` (`FLAT` | `PERCENT`)
- `discountValue`
- `discountAmount`
- `subtotalBeforeDiscount`
- `subtotalAfterDiscount`

Optional fields:
- `requestId`
- `guestTokenHash`

### `promo.preview_rejected`
Emitted when checkout promo preview is rejected by promo rules.

Required fields:
- `event`
- `promoCodeInput` (redacted safe value in current implementation)
- `rejectionCode` (`PROMO_*`)
- `status`

Optional fields:
- `requestId`
- `guestTokenHash`

### `promo.reservation_conflict`
Emitted when promo usage reservation fails due to race/conflict.

Required fields:
- `event`
- `promoId`
- `usageLimit`
- `usageCount`

Optional fields:
- `promoCode`

### `admin.promo_created`
Emitted when admin creates a promo.

Required fields:
- `event`
- `adminUserId`
- `promoId`
- `promoCode`
- `isActive`

Optional fields:
- `requestId`

### `admin.promo_updated`
Emitted when admin updates a promo.

Required fields:
- `event`
- `adminUserId`
- `promoId`
- `promoCode`
- `isActive`

Optional fields:
- `requestId`

### `admin.promo_toggled`
Emitted when admin toggles active/inactive state.

Required fields:
- `event`
- `adminUserId`
- `promoId`
- `promoCode`
- `isActive`

Optional fields:
- `requestId`

