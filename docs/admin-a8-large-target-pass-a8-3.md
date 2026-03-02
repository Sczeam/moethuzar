# Admin Large-Target + Readability Pass (A8.3)

Parent: #82  
Sub-issue: #192

## Objective
Apply minimum interactive target sizing and readability improvements to shared admin primitives and high-frequency controls.

## Areas updated

### Shared shell
- `components/admin/shell/admin-sidebar.tsx`
  - Increased navigation row target sizes using `ADMIN_A11Y.target.minInteractive`.
  - Applied shared focus ring class to navigable group and child links.
  - Increased disabled row readability (`text-base`).

### Orders list
- `app/admin/orders/orders-client.tsx`
  - Status and payment filter chips now use large-target helper sizing.
  - Export, pagination actions now use minimum interactive size.
  - Mobile status/payment badges bumped from micro text to `text-xs` with larger vertical padding.

### Order detail
- `app/admin/orders/[orderId]/page.tsx`
  - Retry, dismiss, copy, call, payment-proof, and modal action/cancel controls updated to `text-sm` and minimum target sizing.

### Catalog
- `app/admin/catalog/catalog-client.tsx`
  - Image remove control moved from tiny (`h-6 w-6`) to compact target contract.
  - Mobile image reorder actions (Move Up/Down/Set Primary) raised to minimum target and readable text size.

## Contract dependency
- Uses `lib/admin/a11y-contract.ts` (`ADMIN_A11Y`) introduced in A8.2.

## Validation
- `pnpm -s tsc --noEmit`
- `pnpm -s lint`

## SOLID mapping
- SRP: visual access/touch-target updates isolated from business logic and API behavior.
- OCP: improvements applied through shared a11y contract classes; new admin surfaces can adopt without modifying existing logic.
- DIP: route components depend on accessibility abstractions (`ADMIN_A11Y`) rather than ad-hoc per-page size literals.

