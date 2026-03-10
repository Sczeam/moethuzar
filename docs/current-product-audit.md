# Current Product Audit

Last updated: 7 March 2026

## Purpose

This document captures the current implemented state of the Moethuzar product so future improvement planning can start from facts instead of memory.

It is intentionally practical:

- what exists today
- what is partial or intentionally deferred
- known open issues and limitations
- where the next high-value improvements likely are

## Product Summary

Moethuzar is now beyond a simple MVP storefront. The current system includes:

- a production-capable apparel storefront
- customer accounts with order history
- COD and prepaid-transfer checkout flows
- a working admin panel for operations, catalog authoring, shipping, payment methods, and promotions
- supporting rollout, QA, and operational docs for the major completed phases

The product still has meaningful gaps, but the foundation is now strong enough that most future work is enhancement rather than initial platform build-out.

## 1. Storefront

### Implemented

- Home page
- Search page
- Lookbook page
- Product detail page
- Cart page
- Checkout page
- Order success page
- Public order tracking page
- Contact page
- Privacy page
- Returns page
- Terms page

### UX / capability currently present

- redesigned hero and storefront shell
- improved navigation and mobile drawer behavior
- account entry in top navigation is now active
- product listing and search browsing
- product cards with buying context
- PDP with:
  - image gallery
  - color selection
  - size selection
  - add-to-cart flow
  - mobile purchase treatment
- cart and checkout with shipping + payment logic

### Not implemented yet

- real wishlist / favourites
- reviews / ratings
- recommendation engine
- advanced storefront filtering and sorting
- richer lookbook/editorial merchandising system
- courier tracking integration
- multi-language
- multi-currency

## 2. Customer Accounts

### Implemented

- `/account/login`
- `/account/register`
- `/account/forgot-password`
- `/account/reset-password`
- `/account`
- `/account/orders`
- account session endpoint:
  - `GET /api/account/auth/me`
- server-action based customer auth flows
- signed-in checkout ownership linking
- account creation nudges:
  - during checkout
  - on success page

### Current behavior

- guest checkout remains valid
- signed-in users can see linked orders
- success page changes CTA based on account outcome
- auth redirects are sanitized and middleware-safe

### Not implemented yet

- address book
- profile editing
- saved preferences
- saved payment methods
- claim-old-order UI flow
- richer account dashboard beyond core account/orders

## 3. Checkout, Shipping, and Payment

### Implemented

- guest checkout
- signed-in checkout
- zone-based shipping fee and ETA logic
- COD flow
- prepaid transfer flow
- payment proof upload
- admin payment review / verification workflow
- promo code apply flow
- persisted discount snapshot on orders

### Operational rules currently supported

- Myanmar-focused shipping rule model
- COD / prepaid split behavior
- payment transfer methods managed in admin
- payment-proof upload supports signed R2 path and fallback behavior

### Not implemented yet

- online payment gateway
- automatic payment verification
- courier/carrier integrations
- advanced shipping campaign logic
- free-shipping campaign rules

## 4. Promotions

### Implemented

- admin promotions workspace
- create/update/toggle promo lifecycle
- promo preview simulator
- promo validation in checkout
- structured promo rejection codes
- observability contract and rollout docs

### Not implemented yet

- advanced campaign scheduling UX
- bundle / BXGY promotions
- category- or collection-targeted promos
- customer segmentation / targeting
- promotion analytics dashboard

## 5. Admin Panel

### Implemented admin surfaces

- admin login
- admin dashboard
- admin orders list
- admin order detail / action center
- admin catalog list
- admin create product
- admin edit product
- admin shipping rules
- admin payment transfer methods
- admin promotions

### Admin capabilities currently present

- redesigned admin IA / sidebar structure
- daily operations dashboard
- order KPIs and filtered workflow
- order action model on detail pages
- product creation wizard architecture
- shared create/edit product form foundations
- variant matrix generation
- multi-image upload queue
- image upload progress
- inline category creation
- shipping rules CRUD
- transfer method CRUD
- promo management

### Not implemented yet

- full admin onboarding/help layer
- customer management module
- advanced analytics/reporting suite
- richer storefront content management
- full collections/content publishing workflow

## 6. Data and Backend Foundation

### Implemented

- Prisma models for:
  - customers
  - orders
  - products
  - variants
  - images
  - carts
  - shipping rules
  - transfer methods
  - promos
- customer/order linking model
- customer order backfill tooling with rollback
- structured API errors with `requestId`
- health and readiness endpoints

### Backend maturity already present

- additive schema evolution approach
- rollout docs for major phases
- targeted regression coverage across key business flows
- operational scripts for manual customer-order backfill

### Not implemented yet

- richer customer CRM model
- deeper business analytics model
- event-stream / audit expansion
- recommendation/search relevance backend

## 7. Testing and Operational Maturity

### Implemented

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- readiness endpoint
- multiple QA matrix docs
- rollout checklists for completed phases
- backfill + rollback tooling for historical customer-order linking

### Current operational quality level

- major delivered phases now have:
  - implementation
  - tests
  - QA matrix or rollout documentation
- master is protected and PR-based workflow is in use

### Not implemented yet

- full observability enrichment for every domain event
- broader incident tooling for support staff
- more end-to-end production smoke automation

## 8. Known Open Issues / Gaps

### Confirmed open items

- mobile PDP bottom sheet / floating gap bug
- promo observability follow-up:
  - `guestTokenHash` and `requestId` enrichment in promo preview rejection logs
- admin onboarding/help layer remains open
- wishlist/favourites is still disabled because the feature is not built

### Intentional boundaries still in place

- no automatic historical order claiming from the customer UI
- no silent post-checkout ownership mutation for old guest orders
- no favourites/wishlist until real backend support exists

## 9. Phase Status Summary

### Effectively complete

- Phase A: shipping fee + delivery options
- Phase B: customer accounts + order history
- Phase C: promotion engine

### Largely complete for current intended scope

- Phase D: admin ops dashboard + inventory visibility
- Phase E: admin UX improvement
- Phase F: storefront UX + conversion polish

### Still open / future-facing

- A9 admin onboarding/help layer
- remaining storefront retention and merchandising upgrades
- lower-priority observability and support enhancements

## 10. Recommended Next Improvement Directions

### If the goal is storefront growth

1. Wishlist / favourites
2. Better search + filter depth
3. Stronger account area beyond orders
4. Recommendations / merchandising surfaces
5. Trust and conversion polish on remaining weak pages

### If the goal is operational strength

1. Admin onboarding/help layer
2. Reporting and analytics depth
3. Support tooling for customer/order incidents
4. Observability enrichment for production debugging

### If the goal is retention and repeat purchase

1. Wishlist
2. richer customer account surfaces
3. post-purchase lifecycle features
4. customer-targeted campaigns and promotions

## 11. Practical Conclusion

The website is no longer in foundation mode.

The current system already supports:

- selling products
- taking orders
- handling Myanmar-specific payment and shipping rules
- managing catalog and operations from admin
- supporting repeat customers with accounts and order history

The next stage should not be broad platform build-out again.

The next stage should be focused improvements in one of these directions:

- conversion
- retention
- operational clarity
- storefront merchandising

That means future planning should now be more selective and business-driven, not infrastructure-driven.
