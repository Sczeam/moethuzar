# Wishlist Architecture

## Scope

This document describes the shipped wishlist v1 architecture.

It covers:
- canonical wishlist truth
- read projection
- async delivery and replay
- guest identity handling
- merge semantics
- deferred follow-up work

It does not describe a generic event platform. The implementation is intentionally wishlist-specific.

## Domain boundaries

### Canonical write model

Source of truth:
- `WishlistItem`

Key properties:
- canonical save object is the product
- optional preference metadata:
  - `preferredVariantId`
  - `preferredColorValue`
  - `preferredSizeValue`
- identity is exactly one of:
  - `customerId`
  - `guestTokenHash`
- one active row per identity + product
- hard delete on remove

Database invariants:
- DB check constraint enforces customer XOR guest identity
- uniqueness is enforced for:
  - `customerId + productId`
  - `guestTokenHash + productId`

### Read model

Derived query model:
- `WishlistItemView`

`WishlistItemView` is not canonical truth. It is a rebuildable projection intended for account wishlist rendering and future commerce-aware display.

Persisted machine-focused fields:
- `wishlistItemId`
- `customerId`
- `guestTokenHash`
- `productId`
- `productName`
- `slug`
- `primaryImageUrl`
- `currentPriceAmount`
- `savedPriceAmount`
- `currency`
- `availabilityState`
- `preferredVariantAvailabilityState`
- `badgeType`
- `preferredColorValue`
- `preferredSizeValue`
- `lastInteractedAt`
- `projectedAt`

Badge copy is not stored as canonical meaning. UI copy is mapped from `badgeType`.

## Identity model

Wishlist supports both authenticated customers and guests.

### Customer identity

- resolved from authenticated customer session
- persisted with `customerId`

### Guest identity

- browser stores a raw guest token
- server hashes that token before persistence
- only `guestTokenHash` is stored in the database
- raw guest token is never persisted

Identity resolution lives in:
- `server/auth/wishlist-identity.ts`
- `lib/wishlist/guest-token.ts`

## Write path

Canonical writes go only through:
- `server/services/wishlist-write.service.ts`

Route handlers do not write wishlist truth directly through Prisma.

Main operations:
- save wishlist item
- remove wishlist item
- update wishlist preferences
- merge guest wishlist into customer wishlist

Persistence boundary:
- `server/repositories/wishlist.repository.ts`

## Saved price semantics

`savedPriceAmount` means:
- effective sell price at initial save creation

It is not overwritten on:
- later preference changes
- later interactions
- merge updates

This supports future price-drop logic without changing the canonical meaning of the field.

## Merge semantics

Guest-to-customer merge is supported and is triggered from login and register flows on a best-effort basis.

Locked merge rules:
- customer row wins if both identities saved the same product
- only `lastInteractedAt` uses a latest-wins rule (`max(lastInteractedAt)`)
- guest metadata only fills missing customer metadata
- richer customer metadata is never downgraded by weaker guest metadata
- guest canonical row is hard-deleted after merge resolution

Important operational rule:
- merge failure must never block login or registration success

## Async architecture

### Durable ledger

Durable async source:
- `EventOutbox`

`EventOutbox` remains the source of replay and recovery.

Wishlist-origin events currently written:
- `wishlist.item.saved`
- `wishlist.item.removed`
- `wishlist.item.preference.updated`
- `wishlist.identity.merged`

### Projector

Projection logic lives only in:
- `server/services/wishlist-projector.service.ts`

Capabilities:
- process a single outbox event by id
- process pending outbox events in batches
- rebuild `WishlistItemView` from canonical truth
- expose prepared reproject entry points for:
  - catalog product updates
  - variant stock changes
  - promotion effective price changes

### Delivery

Production delivery uses:
- Upstash QStash

QStash is delivery only. It is not durability.

Delivery flow:
1. canonical write commits `WishlistItem` + `EventOutbox`
2. after commit, a minimal QStash message is published
3. a private HTTP consumer route receives delivery
4. the consumer verifies QStash authenticity
5. it resolves the outbox row by `eventOutboxId`
6. it calls projector logic using canonical truth
7. the outbox row is marked processed or failed

If QStash publish fails:
- canonical wishlist write still succeeds
- replay/rebuild remains available

## Idempotency and replay

The projector is designed for at-least-once delivery.

Rules:
- already processed outbox events are a clean no-op
- duplicate delivery must not corrupt `WishlistItemView`
- rebuild from canonical truth must restore projection correctness

Local recovery tools:
- `pnpm ops:wishlist-projector`
- `pnpm ops:wishlist-rebuild-view`

## API surface

Wishlist routes:
- `POST /api/wishlist/items`
- `DELETE /api/wishlist/items/:productId`
- `PATCH /api/wishlist/preferences/:wishlistItemId`
- `GET /api/wishlist`
- `GET /api/wishlist/status?productIds=...`
- `POST /api/wishlist/merge`

Notes:
- list endpoint reads `WishlistItemView`
- batch status endpoint uses the read service and is designed for product-card heart state
- merge route exists as an internal application boundary, but normal merge execution is triggered from auth flows

## UI scope in v1

Shipped v1 UI:
- heart toggle on product listing cards
- heart toggle on PDP
- account wishlist page
- top-nav favourites entry

Intentional v1 exclusions:
- no dedicated guest wishlist page
- no notifications
- no boards, public lists, or sharing features

## Deferred producer wiring

Prepared, not fully integrated app-wide:
- `catalog.product.updated`
- `catalog.variant.stock.changed`
- `promotion.effectivePrice.changed`

Shipped today:
- wishlist-origin events are fully wired for projection refresh:
  - `wishlist.item.saved`
  - `wishlist.item.removed`
  - `wishlist.item.preference.updated`
  - `wishlist.identity.merged`
- wishlist writes and auth merge flows therefore refresh projection state through the normal outbox + projector path

Deferred follow-up wiring:
- `catalog.product.updated` is prepared in the projector but not wired from catalog mutation producers yet
- `catalog.variant.stock.changed` is prepared in the projector but not wired from inventory/order-driven stock mutation producers yet
- `promotion.effectivePrice.changed` is prepared in the projector but not wired from promo/price mutation producers yet

Freshness boundary:
- production-ready freshness is guaranteed today for wishlist-origin changes and auth-triggered merge flows
- freshness driven by non-wishlist catalog, stock, or promo mutations remains follow-up work and should not be assumed until those producers are explicitly wired

## Deferred follow-up work

Not in v1:
- back-in-stock notifications
- price-drop notifications
- low-stock notifications
- dedicated guest wishlist page
- richer merchandising or recommendation use of wishlist intent
- broader app-wide producer/event adoption beyond wishlist needs

## Closeout criteria

Wishlist v1 is considered complete when:
- canonical save/remove/update/merge flows are shipped
- account wishlist page is live
- async projection works in production
- replay and rebuild paths are documented
- deferred upstream producer wiring is documented explicitly
