# Phase F GitHub Issue Pack

Use this pack to create and track Storefront UX tasks without revisiting the roadmap each time.

## Labels to create

- `phase:f`
- `area:storefront`
- `type:ux`
- `type:frontend`
- `type:a11y`
- `type:perf`
- `severity:critical`
- `severity:important`
- `severity:polish`

## Milestone

- `Phase F - Storefront UX + Conversion Polish`

## Epic issue

### Title
`[Phase F] Storefront UX + Conversion Polish (Epic)`

### Body
```md
## Goal
Improve storefront clarity, reduce click friction, and raise conversion confidence across Home, Search, PDP, Cart, and Checkout.

## Source of Truth
- docs/next-update-roadmap.md (Phase F)

## Child Issues
- [ ] F-01 Global Layout Shell Audit + Baseline
- [ ] F-02 Navbar + Navigation UX Polish
- [ ] F-03 Hero Section Clarity + CTA Flow
- [ ] F-04 Product Grid Scan Efficiency
- [ ] F-05 Product Card Decision Data Upgrade
- [ ] F-06 Search UX Readability + Recovery
- [ ] F-07 PDP Purchase Clarity + Feedback
- [ ] F-08 Cart + Checkout UX Consistency
- [ ] F-09 Trust + Policy + Footer discoverability
- [ ] F-10 Accessibility + Performance validation pass

## Exit Criteria
- Product cards show decision-critical data (name, price, stock signal).
- Search/listing/PDP/cart/checkout feel consistent and low-friction.
- Mobile layout and interactions are stable.
- Accessibility baseline is verified for updated storefront surfaces.
```

## Child issues

### F-01
**Title:** `F-01 Global Layout Shell Audit + Baseline`

**Body:**
```md
## Objective
Reassess global spacing rhythm, width constraints, and vertical flow consistency across storefront routes.

## Scope
- Home, Search, PDP, Cart, Checkout shell consistency.
- Desktop/tablet/mobile baseline review.

## Acceptance Criteria
- No section-level overlap/layout breaks on supported breakpoints.
- Shared spacing rhythm documented and applied consistently.
```

### F-02
**Title:** `F-02 Navbar + Navigation UX Polish`

**Body:**
```md
## Objective
Improve route discoverability and menu behavior across desktop/mobile.

## Scope
- Rail/menu clarity for Home, Shop/Search, Cart, Track Order.
- Interaction feedback, focus behavior, and motion subtlety.

## Acceptance Criteria
- Primary navigation tasks are reachable in <=2 interactions.
- Keyboard/focus states are explicit and consistent.
```

### F-03
**Title:** `F-03 Hero Section Clarity + CTA Flow`

**Body:**
```md
## Objective
Ensure hero balances visual identity with immediate shopping intent.

## Scope
- Reassess headline/supporting copy hierarchy.
- Improve CTA path to product discovery.

## Acceptance Criteria
- Hero communicates value in first viewport.
- Primary CTA has a clear next step into product browsing.
```

### F-04
**Title:** `F-04 Product Grid Scan Efficiency`

**Body:**
```md
## Objective
Increase scan speed and listing comprehension.

## Scope
- Product grid spacing and consistency.
- Pagination visibility and edge/empty states.
- Image ratio resilience.

## Acceptance Criteria
- Listing remains readable and uniform across mixed image assets.
- Pagination/empty states are clear and actionable.
```

### F-05
**Title:** `F-05 Product Card Decision Data Upgrade`

**Body:**
```md
## Objective
Reduce unnecessary click depth by exposing key purchase data on cards.

## Scope
- Show name, price (or range), stock signal.
- Optional compact variant hints (color/size availability counts).
- Keep CTA clear on mobile + desktop.

## Acceptance Criteria
- Users can assess buyability from grid/search without opening each PDP.
- Card hierarchy is consistent at all breakpoints.
```

### F-06
**Title:** `F-06 Search UX Readability + Recovery`

**Body:**
```md
## Objective
Improve search usability and result confidence.

## Scope
- Result readability and query context.
- Better zero-result recovery actions.
- Keep search cards aligned with listing card system.

## Acceptance Criteria
- Search results are scannable and consistent with storefront cards.
- Zero-result state clearly guides users to recovery actions.
```

### F-07
**Title:** `F-07 PDP Purchase Clarity + Feedback`

**Body:**
```md
## Objective
Make PDP purchase decisions clearer and faster.

## Scope
- Gallery vs purchase panel balance.
- Variant selection clarity and stock messaging.
- Add-to-cart success/error micro-feedback.

## Acceptance Criteria
- Variant state is clear (available/unavailable/out-of-stock).
- Add-to-cart outcomes are explicit and immediate.
```

### F-08
**Title:** `F-08 Cart + Checkout UX Consistency`

**Body:**
```md
## Objective
Reduce checkout friction and improve trust/readability.

## Scope
- Totals/shipping/required actions clarity.
- Form validation messaging and consistency.
- Visual consistency with storefront shell.

## Acceptance Criteria
- Users can understand payable total and required fields at a glance.
- Validation feedback is clear and actionable.
```

### F-09
**Title:** `F-09 Trust + Policy + Footer Discoverability`

**Body:**
```md
## Objective
Increase trust by surfacing policy and support info where users need it.

## Scope
- Terms/privacy/returns/contact discoverability.
- Support touchpoints at decision moments.

## Acceptance Criteria
- Policy/support links are easy to find from storefront flow.
- Footer trust layer is consistent and non-intrusive.
```

### F-10
**Title:** `F-10 Accessibility + Performance Validation Pass`

**Body:**
```md
## Objective
Validate final storefront UX updates against accessibility and performance baseline.

## Scope
- Contrast/focus-state checks.
- LCP/CLS-sensitive component review.
- Reduced-motion behavior verification.

## Acceptance Criteria
- Accessibility baseline passes for updated surfaces.
- Performance regressions are identified and mitigated.
```

## Suggested severity tags

- F-05: `severity:critical`
- F-07: `severity:critical`
- F-08: `severity:critical`
- F-02/F-04/F-06: `severity:important`
- F-01/F-03/F-09/F-10: `severity:polish` (upgrade if blockers found)
