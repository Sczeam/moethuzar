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

## Current Shell Composition

- `components/layout/site-header.tsx`
  - owns nav panel state and floating search overlay state.
  - uses GSAP animation tokens from `lib/animations/nav-menu.ts`.
- `components/layout/header/nav-rail.tsx`
  - right fixed control rail (mobile: burger-only).
- `components/layout/header/nav-panel.tsx`
  - slide-in menu panel, keyboard focus trap, `Escape` close.
- `components/layout/site-footer.tsx`
  - global footer and operational links.

## Search Architecture

- UX:
  - rail search button opens a centered animated overlay search bar.
  - search submit navigates to `/search?q=...`.
- Route:
  - `app/search/page.tsx` renders SSR search results and pagination.
- API:
  - `GET /api/search/products` with typed validation in `lib/validation/search.ts`.
  - supports: `q`, `page`, `pageSize`, `sort`, `category`, `color`, `size`, `inStock`, `minPrice`, `maxPrice`.

## Visual System Notes

- Palette and shell primitives are centralized in `app/globals.css`.
- Reusable utility classes are used for consistency:
  - `vintage-shell`, `vintage-panel`
  - `btn-primary`, `btn-secondary`
  - `field-input`, `field-select`
- Core storefront images use Next.js `Image` with remote R2 domain allowlist.

## Accessibility Baseline

- Skip link in `app/layout.tsx`.
- Menu `aria-expanded`, `aria-controls`, dialog semantics.
- Keyboard support:
  - tab loop inside open menu panel
  - `Escape` closes menu and search overlay.
- Reduced-motion behavior respected in GSAP motion flows.

## Status Snapshot

- Phase 0 (stability baseline): completed.
- Phase 1 (core shell + nav polish): completed.
- Phase 2 (storefront + PDP refinement): completed.
- Phase 3 (accessibility + visual QA): completed baseline pass.

## Next Evolution (Post-MVP)

- Move hero and key storefront copy to admin-managed site settings.
- Add server caching strategy (`revalidateTag`/`revalidatePath`) around admin mutations.
- Add richer search facets UI (category/color/size/price) in `/search`.
- Add design regression checks for key breakpoints in CI.
