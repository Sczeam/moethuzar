# Next Update Roadmap

Last updated: 18 February 2026

## Goal
Ship the next commerce upgrade set with high business impact and low operational risk for a COD-first Myanmar apparel store.

## Prioritization Principles
- Revenue impact first (features that improve conversion and reduce checkout drop-off).
- Operational simplicity second (features that reduce manual admin back-and-forth).
- Avoid schema churn unless feature value is high.
- Keep each phase releasable and testable on its own.

## Phase A: Shipping Fee + Delivery Options (Highest Priority)

### Why
Current checkout has address capture but no delivery pricing logic. Shipping cost and delivery expectation should be explicit before order placement.

### Scope
- Add shipping rule model:
  - zone key (state/region + township/city)
  - fee amount
  - estimated delivery window label (e.g. `1-2 days`, `3-5 days`)
  - active/inactive toggle
- Zone policy (frozen):
  - Priority zones: `Yangon`, `Mandalay`, `Pyinmana`, `Nay Pyi Daw`
  - Mandatory fallback zone: `Other (Myanmar)`
  - Customers selecting non-priority locations (including `Other`) must resolve to fallback.
- Add checkout fee calculation:
  - derive shipping rule from selected address
  - show shipping fee + total in checkout summary
  - fee amount stored and calculated as MMK integer only
- Persist shipping snapshot in order:
  - selected zone
  - fee
  - ETA label
- Admin shipping rules page:
  - list/add/edit/toggle rules
  - full CRUD
  - safe defaults/fallback rule support
  - guardrail: cannot disable/delete the last active fallback rule

### Non-goals
- Courier API integrations
- Real-time shipping tracking
- Free shipping (kept out of v1)

### Frozen implementation decisions
- Currency handling: MMK integer only.
- Fallback safety policy: hard block checkout if no active applicable rule exists.
- Future-proofing: schema should allow adding threshold-based free shipping later without breaking existing rules.
- Admin capability: full CRUD for shipping rules in v1.

### Acceptance criteria
- Customer sees shipping fee and final total before place order.
- Shipping fee is saved in order and visible in admin order detail.
- If selected location is outside priority zones, system uses `Other (Myanmar)` fallback rule.
- Fallback zone cannot be disabled unless another fallback is configured.
- If no active applicable rule exists, checkout is blocked with clear actionable error.
- Unit/integration tests cover fee calculation and fallback behavior.

## Phase C: Promotion Engine (Basic)

### Why
Needed for campaigns and conversion pushes.

### Scope
- Promo code entity:
  - code, type (flat/%), value, min order, start/end, usage cap, active
- Checkout apply/remove promo code.
- Save discount snapshot on order.

### Acceptance criteria
- Invalid/expired codes are rejected with clear message.
- Final payable total is deterministic and auditable.

## Phase E: Admin UX Improvement (Catalog Authoring)

### Why
Current product authoring flow is too manual and error-prone for apparel combinations (for example 5 colors x 3 sizes).

### Scope
- Add option-first variant generation:
  - define colors and sizes once
  - auto-generate variant matrix
  - allow disabling specific combinations
- Add bulk edit tools:
  - apply price/compare-at/material/inventory/active state to many variants at once
- Add pre-submit validation:
  - duplicate SKU detection
  - duplicate option combination detection (same color + size)
  - row-level error display before API submit
- Improve product editor information architecture:
  - split into focused sections (Basic Info, Media, Variants, Inventory)
- Add variant management quality-of-life:
  - quick duplicate row
  - multi-select variants for bulk changes
  - stable sorting by option values

### Acceptance criteria
- Admin can generate 15 variants (5x3) in under 1 minute.
- Duplicate SKUs and duplicate combinations are blocked before submit.
- Variant bulk edits reduce repeated manual input significantly.
- Catalog creation/editing support load drops (fewer admin input mistakes).

## Phase F: Storefront UX + Conversion Polish

### Why
Storefront browsing currently has high interaction cost. For example, product cards show only name, so customers must click deeper to see basic buying info.

### High-Level Reanalysis Plan (Section by Section)

#### 1) Global Layout Shell
- Reassess spacing rhythm, section width strategy, and vertical flow consistency across home/search/PDP/cart/checkout.
- Verify desktop/tablet/mobile behavior before section-specific polish to avoid local fixes that break globally.

#### 2) Navbar + Navigation System
- Re-evaluate discoverability of primary routes (home, shop/search, cart, track order).
- Reassess rail/menu behavior on mobile vs desktop for clarity and minimal friction.
- Validate interaction feedback, accessibility states, and motion subtlety.

#### 3) Hero Section
- Reassess content hierarchy (brand, supporting copy, CTA) and immediate user comprehension.
- Validate balance between visual mood and practical shopping intent.
- Ensure hero supports fast entry into product discovery.

#### 4) Product Grid (Listing Layer)
- Re-evaluate scan efficiency, information density, and card-to-card consistency.
- Validate pagination/navigation discoverability and state clarity.
- Ensure listing behavior remains strong across different image aspect ratios.

#### 5) Product Card
- Reassess which decision-critical data must be visible at card level (name, price, stock/availability signal).
- Validate CTA clarity and hover/tap behavior for both desktop and touch devices.
- Ensure card design reduces unnecessary click depth.

#### 6) Search Experience
- Reassess search entry, result readability, and query context.
- Validate empty/no-result recovery paths and refinement guidance.
- Ensure consistent card and sorting/filter interaction with main listing.

#### 7) Product Detail Page (PDP)
- Reassess gallery + purchase panel balance and visual priority.
- Validate variant selection clarity (color/size availability), stock messaging, and add-to-cart confidence.
- Ensure error/success feedback is explicit and low-friction.

#### 8) Cart + Checkout Experience
- Reassess readability of totals, shipping fee, and required actions.
- Validate form clarity, validation messaging, and trust signals.
- Ensure consistent styling and interaction model with storefront shell.

#### 9) Trust + Policy + Footer Layer
- Re-evaluate discoverability of terms/privacy/returns/contact and operational trust copy.
- Validate whether support and policy entry points are visible at decision moments.

#### 10) Accessibility + Performance Pass
- Run contrast and focus-state review on updated storefront surfaces.
- Reassess LCP/CLS-sensitive components (hero/listing images, interactive overlays).
- Ensure motion remains optional and reduced-motion safe.

### Execution Approach (High Level)
- Step 1: Audit each section and capture issues by severity (`critical`, `important`, `polish`).
- Step 2: Convert issues into grouped implementation batches (layout, interaction, content hierarchy).
- Step 3: Ship section-wise improvements incrementally with visual + functional QA per batch.
- Step 4: Run final storefront coherence pass to ensure one unified UX language.

### Scope
- Product card information upgrade:
  - show primary price (or price range if variant prices differ)
  - show quick stock signal (`In Stock`, `Low Stock`, `Sold Out`)
  - show compact variant hints (e.g. color count / top sizes available)
  - keep image hover behavior but improve content hierarchy for scanning
- Product listing interaction polish:
  - preserve current aesthetic but reduce "extra click" friction
  - ensure card footer hierarchy (name, price, CTA) is consistent on all breakpoints
  - strengthen empty/edge states for pagination/search results
- PDP conversion polish:
  - show selected variant summary clearly (color, size, unit price, stock status)
  - prevent invalid combinations early and keep disabled states explicit
  - add micro-feedback around add-to-cart success/failure
- Search UX improvement:
  - improve search result readability with same enriched product cards
  - add applied-query context and clearer zero-result recovery actions
- Mobile-first UX hardening:
  - verify tap targets, spacing, sticky action behavior, and no overlap issues
  - remove layout breaks and maintain fast visual scan on smaller devices
- Accessibility + trust pass:
  - ensure text contrast and interactive focus states meet accessibility baseline
  - keep checkout/cart visual consistency and reduce ambiguous field states

### Non-goals
- Full recommendation engine/personalization
- Ratings/reviews platform integration
- Multi-language or multi-currency rollout

### Acceptance criteria
- Product cards on home/search show at least: name, price, stock signal.
- Customers can identify buyability from listing pages without opening every PDP.
- Mobile storefront flow (home -> PDP -> cart) works without layout breakage.
- Search zero-results path clearly guides users back to product discovery.
- Accessibility baseline is re-verified for updated storefront surfaces.

## Phase B: Customer Accounts + Order History

### Why
Reduces support load and increases trust for repeat buyers.

### Scope
- Optional customer auth (do not break guest checkout).
- "My Orders" page for signed-in users.
- Link orders to customer identity when applicable.

### Acceptance criteria
- Existing guest checkout still works unchanged.
- Signed-in users can see their orders and statuses.

## Phase D: Admin Ops Dashboard + Inventory Alerts

### Why
Improves daily operational visibility.

### Scope
- Dashboard cards: pending orders, confirmed today, delivered today, gross revenue.
- Low-stock alert list by variant inventory threshold.

### Acceptance criteria
- Admin can quickly identify what to action today.
- Inventory risk is visible without opening each product.

## Priority Order After Phase A
1. Phase E (Admin UX Improvement)
2. Phase F (Storefront UX + Conversion Polish)
3. Phase C (Promotion Engine)
4. Phase B (Customer Accounts + Order History)
5. Phase D (Admin Ops Dashboard + Inventory Alerts)

Rationale:
- Phase E has the highest immediate operational impact and reduces daily admin friction.
- Phase F directly improves storefront conversion by lowering browse-to-cart friction.
- Phase C is the next direct revenue lever after storefront readability and conversion flow improve.
- Phase B improves retention, but guest checkout already covers current MVP conversion path.
- Phase D is valuable for visibility but less urgent than core authoring and conversion levers.

## Suggested Branching / Delivery Strategy
- `feat/shipping-rules-phase-a`
- `feat/admin-ux-phase-e`
- `feat/storefront-ux-phase-f`
- `feat/promo-engine-phase-c`
- `feat/customer-accounts-phase-b`
- `feat/admin-ops-dashboard-phase-d`

Use feature flags or phased UI exposure if needed.

## Testing Strategy Per Phase
- Keep `pnpm check:preflight` green on every phase.
- Add tests first for calculation logic and status transitions.
- Add one end-to-end happy path per shipped phase.

## Risks and Mitigation
- Risk: rule conflicts or missing zone mapping.
  - Mitigation: explicit fallback policy + validation.
- Risk: migration complexity from growing order schema.
  - Mitigation: additive migrations and snapshot fields.
- Risk: checkout regressions.
  - Mitigation: preserve existing guest checkout tests and add new fee tests.

## Recommendation
Start with **Phase A** now. It has the strongest immediate business value and builds a clean foundation for promotions and customer trust features.
