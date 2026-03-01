# Admin Error Presenter Contract (A7.3)

This document defines how admin UI should convert API error payloads into clear user guidance.

## Scope
- Shared presenter: `lib/admin/error-presenter.ts`
- Current consumers:
  - `app/admin/shipping-rules/shipping-rules-client.tsx`
  - `app/admin/payment-transfer-methods/payment-transfer-methods-client.tsx`
  - `app/admin/catalog/catalog-client.tsx`
  - `app/admin/orders/[orderId]/action-feedback.ts`
  - `app/admin/orders/[orderId]/page.tsx`

## Input Contract
Presenter expects API-style payloads shaped like:
- `code?: string`
- `error?: string`
- `requestId?: string`
- `issues?: [{ path, message }]`

## Output Behavior
- Converts known codes into action-oriented guidance:
  - `CONFLICT`
  - `VALIDATION_ERROR`
  - `SCHEMA_NOT_SYNCED`
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `RATE_LIMITED`
- Supports first-issue extraction for validation payloads.
- Optionally appends request-id in user-safe format.

## Orders Action Mapping
- `presentOrderActionError()` maps stale transition/payment-review codes to non-retry warning copy.
- Keeps retryable vs non-retryable behavior explicit.

## SOLID Mapping
- SRP: error translation is isolated from UI rendering and transport calls.
- OCP: add new code mappings in one place without changing each client.
- DIP: admin pages depend on presenter abstraction, not raw payload structure.
