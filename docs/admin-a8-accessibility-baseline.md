# Admin Accessibility Baseline Audit (A8.1)

Parent: #82  
Sub-issue: #190

## Audit Scope
Routes reviewed:
- `/admin`
- `/admin/orders`
- `/admin/orders/[orderId]`
- `/admin/catalog`
- `/admin/shipping-rules`
- `/admin/payment-transfer-methods`

Method:
- Static code audit of current admin UI implementation.
- Keyboard flow and semantics review against existing component structure.
- Target-size and readability checks against 44x44 interactive minimum and older-user readability expectations.

---

## Current Strengths
- Core navigation and dialogs already expose meaningful `aria-label` and dialog semantics in key places.
- Focus-visible styles are present across many actionable controls.
- Orders action modal includes `aria-describedby` + `role="alert"` for validation feedback.
- Some high-priority action buttons already meet large-target minimum (`min-h-11`).

---

## Priority Findings

### P1 (Important, high user impact)

1. **Inconsistent minimum target sizes across admin controls**
- Impact: older or low-tech operators miss controls on touch devices.
- Evidence:
  - `app/admin/catalog/catalog-client.tsx` (image row controls use compact `px-2 py-1 text-xs`, remove chip `h-6 w-6`)
  - `app/admin/orders/[orderId]/page.tsx` (multiple `btn-secondary text-xs` action controls)
  - `app/admin/orders/orders-client.tsx` (filter/action controls optimized for density, not target size)
- Owner area: `shared + catalog + orders`

2. **Very small typography on critical data/status labels**
- Impact: reduced readability and slower decision-making for non-technical users.
- Evidence:
  - Extensive `text-xs` usage in dashboard/order/catalog/settings surfaces
  - KPI secondary labels and status chips use dense small text
- Owner area: `shared + dashboard + orders + catalog + settings`

3. **Filter inputs lacking explicit visible labels in Orders list**
- Impact: screen reader and first-time usability friction (placeholder-only guidance is fragile).
- Evidence:
  - `app/admin/orders/orders-client.tsx` uses placeholder text for search/date filter semantics without persistent associated label text.
- Owner area: `orders`

4. **Catalog image management accessibility debt on mobile**
- Impact: reorder/remove workflow is hard on touch and not fully clear for assistive navigation.
- Evidence:
  - `app/admin/catalog/catalog-client.tsx` drag interactions depend on pointer-first pattern; mobile fallback actions remain compact.
- Owner area: `catalog`

5. **No single admin-wide a11y contract/tokens for targets/readability/focus**
- Impact: regressions likely as new admin modules are added.
- Evidence:
  - Multiple per-page style choices with no centralized admin a11y contract module.
- Owner area: `shared`

### P2 (Should-fix)

6. **Status/feedback messages are not consistently announced via live regions**
- Impact: async outcomes may be missed by assistive tech users.
- Evidence:
  - several pages use plain `<p>` for status feedback (for example catalog status text).
- Owner area: `shared + catalog + settings`

7. **Table-to-mobile parity is functionally good but semantic consistency is uneven**
- Impact: potential cognitive load moving between list and table variants.
- Evidence:
  - Orders and dashboard shift from table to card/list with different cue density.
- Owner area: `orders + dashboard`

8. **Topbar identity chip target size below baseline on some breakpoints**
- Impact: low-priority but inconsistent target standard.
- Evidence:
  - `components/admin/shell/admin-topbar.tsx` uses `h-8 w-8` on smaller viewports.
- Owner area: `shared shell`

---

## Route Coverage Matrix

| Route | Keyboard path | Target size | Readability | Form semantics | Dialog semantics | Overall |
|---|---|---|---|---|---|---|
| `/admin` | Partial pass | Partial fail | Partial fail | N/A | N/A | Needs pass |
| `/admin/orders` | Partial pass | Partial fail | Partial fail | Partial fail | N/A | Needs pass |
| `/admin/orders/[orderId]` | Pass with gaps | Partial fail | Partial fail | Pass | Pass | Needs pass |
| `/admin/catalog` | Partial pass | Fail hotspots | Partial fail | Partial pass | Pass | Needs pass |
| `/admin/shipping-rules` | Partial pass | Partial fail | Partial fail | Partial pass | N/A | Needs pass |
| `/admin/payment-transfer-methods` | Partial pass | Partial fail | Partial fail | Partial pass | N/A | Needs pass |

Legend:
- Pass: no blocking concern found in this baseline
- Partial fail: improvements required but not fully blocking
- Fail hotspots: clear high-impact areas requiring immediate remediation in A8

---

## Recommended Remediation Order
1. A8.2 contract first (targets, focus, labels, live-region guidance).
2. A8.3 primitive-level large-target/readability pass.
3. A8.4 keyboard/dialog and error-association hardening.
4. A8.5 contrast/state pass.
5. A8.6 QA matrix + CI guardrail to prevent regression.

This sequence minimizes rework and follows OCP/SRP by fixing shared abstractions before page-level patches.

---

## Exit Criteria for A8.1
- [x] Baseline findings documented by route.
- [x] Findings prioritized by severity.
- [x] Owner area assigned for each key finding.
- [x] Remediation sequence defined for A8.2–A8.6.
