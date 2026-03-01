# Admin Settings QA Matrix (A6.5)

Scope:
- `/admin/shipping-rules`
- `/admin/payment-transfer-methods`

Environment prerequisites:
- Admin-authenticated session
- Seeded data with at least one shipping fallback rule and one payment method
- API reachable for:
  - `GET/POST/PATCH/DELETE /api/admin/shipping-rules`
  - `GET/POST/PATCH/DELETE /api/admin/payment-transfer-methods`

## Shipping Rules

| ID | Scenario | Steps | Expected UI Result | Expected API Result |
|---|---|---|---|---|
| SH-01 | Create normal rule | Fill zone preset (non-fallback), fee, ETA, submit | Success message shown, row appears in table | `POST 201 { ok: true }` |
| SH-02 | Create fallback rule | Choose fallback preset, submit | Fallback flag shown in table/status | `POST 201 { ok: true }` |
| SH-03 | Missing required integer fee | Enter invalid/non-integer fee | Inline status error, no create | Client-side block or `POST 400 VALIDATION_ERROR` |
| SH-04 | Missing ETA | Leave ETA empty, submit | Validation error shown, no create | Client-side block or `POST 400 VALIDATION_ERROR` |
| SH-05 | Delete non-fallback active rule | Delete active non-fallback row | Confirm dialog + success | `DELETE 200 { ok: true }` |
| SH-06 | Delete last active fallback (guardrail) | Attempt delete when only fallback active rule remains | Warning/error, no destructive result | `DELETE 409 FALLBACK_RULE_REQUIRED` |
| SH-07 | Edit rule fields | Open Edit, change fee/ETA, save | Updated row values reflected | `PATCH 200 { ok: true }` |
| SH-08 | Coverage warnings | Remove/deactivate required key zones | Health panel warnings displayed | `GET 200` with warning state derived client-side |
| SH-09 | Load failure handling | Force `GET` failure | Error message with fallback text | `GET non-2xx` -> graceful status text |

## Payment Transfer Methods

| ID | Scenario | Steps | Expected UI Result | Expected API Result |
|---|---|---|---|---|
| PM-01 | Create BANK method | Label + channel=BANK + account name + account number | Success and row appears | `POST 201 { ok: true }` |
| PM-02 | Create WALLET method | Label + channel=WALLET + account name + phone | Success and row appears | `POST 201 { ok: true }` |
| PM-03 | BANK missing account number | Submit BANK without account number | Validation error shown | Client-side block or `POST 400 VALIDATION_ERROR` |
| PM-04 | WALLET missing phone | Submit WALLET without phone | Validation error shown | Client-side block or `POST 400 VALIDATION_ERROR` |
| PM-05 | Edit preserves existing method code | Edit legacy/hyphen code method | Save succeeds; no silent code mutation | `PATCH 200`, no accidental code conflict |
| PM-06 | Long label generated code safety | Create with very long label | Save succeeds (generated code <=64 chars) | `POST 201` (not validation failure) |
| PM-07 | Delete inactive method | Delete inactive row | Success, row removed | `DELETE 200 { ok: true }` |
| PM-08 | Delete last active method guardrail | Try deleting only active method | Guardrail warning; blocked | UI block and/or API non-2xx |
| PM-09 | Health panel warnings | Set active methods to 0/1 | Correct warnings shown | `GET 200`, warning state derived client-side |
| PM-10 | Create success + refresh failure | Simulate POST success then GET fail | Form resets immediately, no duplicate payload left | `POST 201`, subsequent `GET` failure handled gracefully |

## Regression Checks

- Confirm structured error handling still uses route error payloads (`error`, `code`, `requestId`) where available.
- Confirm settings nav links remain consistent and unchanged across both pages.
- Confirm no raw technical fields (`sortOrder`, `methodCode`) are exposed in create/edit UI.
- Confirm fallback/business guardrails are advisory in UI but enforced server-side where applicable.

## Sign-off Criteria

- All SH-* and PM-* scenarios pass on staging.
- No new TypeScript errors.
- Lint baseline unchanged (existing known warning outside settings scope is acceptable).
- A6.1–A6.4 behaviors remain intact.
