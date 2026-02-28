# Admin Settings Copy + IA Contract (A6.1)

This document defines canonical copy and navigation intent for the Admin Settings surface so Shipping Rules and Payment Transfer Methods stay consistent.

## Scope
- `/admin/shipping-rules`
- `/admin/payment-transfer-methods`

## IA Contract
- Settings-adjacent pages expose the same utility links in the same order:
  1. Orders
  2. Shipping Rules
  3. Payment Methods
  4. Catalog
- Link labels must stay short, noun-based, and route-stable.

## Copy Contract
- Shared copy source of truth: `lib/admin/settings-copy.ts`.
- Page-level strings (title, section headings, empty/loading text, success/error fallbacks) are read from shared constants, not hardcoded per page.
- Dynamic status copy uses formatter functions from the shared module.

## Implementation Notes
- UI behavior and server/API logic are unchanged in A6.1.
- This is a copy/IA extraction step to reduce drift and simplify later Settings redesign work.

## Change Rules
- Add new settings-facing pages by extending `ADMIN_SETTINGS_NAV_LINKS`.
- Keep terminology consistent:
  - “Shipping Rules”
  - “Payment Transfer Methods”
  - “Create”, “Edit”, “Current”
- Do not duplicate these strings in client components.
