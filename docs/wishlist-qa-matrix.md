# Wishlist QA Matrix

## Purpose

This matrix is the closeout verification checklist for wishlist v1.

It is intended to verify shipped behavior, not hypothetical future wishlist features.

## Preconditions

- wishlist schema migration applied
- production or local DB reachable
- customer auth working
- QStash configured for the target production environment, or local replay/rebuild available

## Verification matrix

| Area | Scenario | Expected result |
| :--- | :--- | :--- |
| Guest save | Guest hearts a product card | Canonical wishlist write succeeds and heart becomes saved |
| Guest save | Guest hearts a PDP product with no variant selected | Product is saved without preferred variant metadata |
| Guest save | Guest hearts a PDP product after selecting variant/size/color | Product is saved with preferred preference metadata |
| Guest remove | Guest removes a saved product | Canonical row is deleted and heart returns to unsaved |
| Guest identity | First guest wishlist request | Guest cookie is attached and DB stores only `guestTokenHash` |
| Customer save | Signed-in customer hearts a product | Row is written with `customerId` and not `guestTokenHash` |
| Account list | Signed-in customer opens `/account/wishlist` | Saved products appear from `WishlistItemView` |
| Account empty state | Signed-in customer with no saved products opens `/account/wishlist` | Empty-state UI is shown |
| Batch status | Product cards render on a page with mixed saved/unsaved products | `GET /api/wishlist/status` returns correct saved state per product |
| Merge | Guest saves products, then logs in | Guest wishlist is merged into customer wishlist |
| Merge | Guest and customer both saved the same product | No duplicate row; customer row remains canonical |
| Merge failure | Login or register occurs while merge throws | Auth still succeeds; merge failure is logged safely |
| Remove after merge | Product merged to customer wishlist then removed | Customer canonical row is deleted cleanly |
| Projection | Wishlist-origin event is processed | `WishlistItemView` is created or updated correctly |
| Duplicate delivery | Same event is processed more than once | Projection remains correct; no corruption |
| Already processed event | Consumer receives already processed outbox event | Clean no-op |
| Replay | Run `pnpm ops:wishlist-projector` with pending outbox rows | Pending wishlist events project successfully |
| Rebuild | Run `pnpm ops:wishlist-rebuild-view` | `WishlistItemView` is fully reconstructed from canonical truth |
| QStash disabled | Production delivery disabled via env | Canonical writes still succeed; route safely acknowledges disabled mode |
| QStash misconfigured | Delivery enabled without signing keys | Consumer returns misconfiguration error and logs safely |
| QStash consumer auth | Request with invalid QStash signature | Consumer rejects the request |
| Price semantics | Re-saving or updating preferences on an item | `savedPriceAmount` stays frozen at initial save price |
| Product availability | Save archived/inactive product | Request is rejected with wishlist availability error |

## Route checklist

### Storefront/customer routes
- `POST /api/wishlist/items`
- `DELETE /api/wishlist/items/:productId`
- `PATCH /api/wishlist/preferences/:wishlistItemId`
- `GET /api/wishlist`
- `GET /api/wishlist/status?productIds=...`
- `POST /api/wishlist/merge`

### Account page
- `/account/wishlist`

## Local operational checklist

Use these scripts when QStash is not driving the projection:

- `pnpm ops:wishlist-projector`
- `pnpm ops:wishlist-rebuild-view`

Expected behavior:
- projector processes pending outbox events and logs replay start/completion
- rebuild reconstructs `WishlistItemView` and logs rebuild start/completion

## Automated coverage already in repo

Core automated coverage includes:
- `server/domain/wishlist.test.ts`
- `server/domain/wishlist-view.test.ts`
- `server/services/wishlist-write.service.test.ts`
- `server/services/wishlist-projector.service.test.ts`
- `server/services/wishlist-read.service.test.ts`
- `server/services/wishlist-queue.service.test.ts`
- `server/security/wishlist-routes.test.ts`
- `server/security/wishlist-queue-consumer.test.ts`
- `server/security/account-login-action.test.ts`
- `server/security/account-register-action.test.ts`

## Explicit deferred checks

These are intentionally not part of v1 QA completion:
- stock/promo producer freshness from unrelated domains everywhere in the app
- notification delivery
- guest wishlist page
- merchandising or recommendation behavior

## Closeout note

If all scenarios above pass and the architecture docs match shipped behavior, wishlist v1 closeout issue `#269` can be closed and parent issue `#264` can be treated as complete.
