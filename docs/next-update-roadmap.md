# Next Update Roadmap

Last updated: 15 February 2026

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

## Phase D: Admin Ops Dashboard + Inventory Alerts

### Why
Improves daily operational visibility.

### Scope
- Dashboard cards: pending orders, confirmed today, delivered today, gross revenue.
- Low-stock alert list by variant inventory threshold.

### Acceptance criteria
- Admin can quickly identify what to action today.
- Inventory risk is visible without opening each product.

## Suggested Branching / Delivery Strategy
- `feat/shipping-rules-phase-a`
- `feat/customer-accounts-phase-b`
- `feat/promo-engine-phase-c`
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
