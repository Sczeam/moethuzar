# Frontend Architecture (App Router)

## Core Pattern

- Use **Server Components by default**.
- Use **Client Components only for interactive islands** (menu, selectors, forms with client state).
- Keep route files (`app/**/page.tsx`) thin and focused on composition.

## Directory Strategy

- `app/*`: routing and page composition only.
- `features/*`: feature-first domain modules.
- `components/ui/*`: reusable presentational primitives.
- `components/layout/*`: global layout shell.
- `lib/*`: shared cross-feature utilities and constants.

## Feature Module Convention

Each feature can include:

- `components/` for UI blocks
- `server/` for data fetching/query orchestration
- `types.ts` for feature-level data contracts

Example:

- `features/storefront/home/components/*`
- `features/storefront/home/server/get-home-page-data.ts`
- `features/storefront/home/types.ts`

## Data Access Rule

- Page components do not call Prisma/services directly when a feature server module exists.
- Route handlers and feature server modules own data fetching and error handling.

## Scaling Notes

- For dynamic CMS-like storefront sections (hero text/image), move constants into DB-backed site settings later.
- For cache control in growth phase, add `revalidateTag`/`revalidatePath` from mutation points.

## Frontend Roadmap (Agreed Plan)

### Phase 0: Stability Baseline

- Enforce preflight checks (`prisma:generate`, lint, typecheck, test, build).
- CI and release gate alignment.
- Baseline runbook readiness checks.

### Phase 1: Core Shell + Navigation Polish

- Refactor nav into focused subcomponents (rail, panel, links/icons).
- Centralize nav config and GSAP animation tokens.
- Add accessibility hardening:
  - focus trap
  - `Escape` close
  - `aria-expanded`, `aria-controls`, dialog semantics.
- Responsive shell pass for mobile/tablet/desktop.

### Phase 2: Storefront + PDP UX Refinement

- Home/hero structure and spacing cleanup.
- Product grid consistency (card ratio, hover image behavior, pagination UX on mobile).
- PDP layout consistency across breakpoints.
- Variant state clarity (selected, disabled, out-of-stock).
- Cart/checkout/track form style consistency.

### Phase 3: Accessibility + Visual QA

- Perform keyboard-only navigation checks across key journeys.
- Run contrast audit for text/surface/button states against WCAG AA targets.
- Verify reduced-motion behavior and focus visibility.
- Fix remaining UI inconsistencies discovered during QA.

### Phase 4: Launch-Ready Frontend Hardening

- Final cross-device responsive sweep (especially iPhone widths).
- No-overflow/no-layout-shift validation on core pages.
- Final `pnpm check:preflight` pass before release.
- Lock visual/system primitives to minimize regression risk.
