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
