# Admin Accessibility Contract (A8.2)

Parent: #82  
Sub-issue: #191

## Goal
Define a reusable accessibility contract for admin UI so new screens can adopt consistent target sizes, focus behavior, and semantics without duplicating ad-hoc rules.

## Contract Module
- `lib/admin/a11y-contract.ts`

### Exposed primitives
- `ADMIN_A11Y.target.minInteractive`
  - minimum interactive target baseline for critical controls (44x44 equivalent)
- `ADMIN_A11Y.target.compactInteractive`
  - compact but still touch-safe target size for small utility controls
- `ADMIN_A11Y.focus.ring`
  - shared focus-visible treatment for keyboard users
- `adminLiveRegionProps(tone)`
  - standard `role` + `aria-live` + `aria-atomic` for status/error announcements
- `adminFieldA11y({ fieldId, errorMessage, describedById })`
  - helper for `aria-invalid`, `aria-describedby`, and stable `errorId` generation

## Initial adoptions (A8.2)
1. `components/admin/shell/admin-topbar.tsx`
- sidebar open button now uses contract target + focus classes
- identity chip uses compact contract target class

2. `app/admin/orders/orders-client.tsx`
- order filters now use explicit labels (search/from/to/page-size)
- Apply and Export buttons use shared minimum target class

## Extension guidance
- Any new admin page should consume contract classes/helpers before introducing new local a11y styling.
- Prefer semantic labels over placeholder-only guidance for user inputs.
- Keep interactive controls on high-frequency workflows at `minInteractive` target size.

## SOLID mapping
- SRP: accessibility rules live in dedicated contract module.
- OCP: new surfaces extend behavior by consuming contract primitives.
- DIP: route/page code depends on a11y abstractions instead of per-page hardcoded classes.
- ISP: helper APIs stay small and focused (`field` semantics vs `live region` semantics).

