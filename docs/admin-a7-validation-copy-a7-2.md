# Admin Validation Copy Contract (A7.2)

This document defines the validation wording contract for admin settings forms.

## Scope
- `lib/admin/validation-copy.ts`
- `lib/admin/shipping-rule-form-adapter.ts`
- `lib/admin/payment-transfer-method-form-adapter.ts`

## What Changed
- Added centralized field labels for settings forms:
  - Shipping fields (`zone`, `shippingFee`, `freeShippingThreshold`, `deliveryEta`)
  - Payment method fields (`methodLabel`, `accountName`, `accountNumber`, `phoneNumber`, `methodCode`)
- Added shared message templates:
  - `required(field)`
  - `requiredFor(field, context)`
  - `wholeMmkAmount(field)`
  - `maxLength(field, limit)`
- Replaced inline hardcoded validation strings in shipping/payment adapters with shared templates.

## Contract Rules
- Validation copy should be generated from shared templates.
- New settings fields must add labels to `ADMIN_VALIDATION_FIELDS`.
- No adapter-specific hardcoded validation strings for migrated modules.

## Tone Rules
- Keep wording short and actionable.
- Avoid backend/internal terms.
- Mention exact field names the user can fix.

## SOLID Mapping
- SRP: validation wording is separated from field parsing and payload mapping.
- OCP: new validation message patterns can be added via the shared module without rewriting adapters.
- DIP: adapters depend on validation-copy abstractions, not literal strings.
