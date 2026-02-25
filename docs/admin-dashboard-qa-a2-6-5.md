# A2.6.5 QA Report: Admin Dashboard Shell + Analytics Widgets

Date: 2026-02-25  
Scope issue: `#105`  
Related implementation issues: `#101`, `#102`, `#103`, `#104`  
Follow-up issue (deferred): `#111`

## 1) Environment + Method

- Branch under QA: `feat/a2-6-5-dashboard-qa-pass`
- Target route: `/admin`
- Verification types:
  - automated checks (`vitest`, `typecheck`, `build`)
  - data validation against direct DB queries
  - UI/a11y checklist pass based on implemented interaction paths

## 2) Automated Verification

Executed:

```bash
pnpm vitest run server/repositories/admin-ops-dashboard.repository.integration.test.ts server/services/admin-ops-dashboard.service.test.ts
pnpm typecheck
pnpm build
```

Result: Pass

- Service/repository tests passed (`7/7`)
- TypeScript check passed
- Production build passed

## 3) QA Checklist (A2.6.5 Acceptance)

### First-run discoverability
- Pass
- Sidebar grouping (Overview, Sales, Catalog, Content, Marketing, Settings) is visible and scannable.
- Top-level dashboard cards surface primary actions/health immediately.

### <=2 click paths for core operations
- Pass
- Open Orders: Dashboard -> Quick Actions -> Open Orders (`/admin/orders`)
- Open Products: Dashboard -> Quick Actions -> Open Products (`/admin/catalog`)
- Create Product: Dashboard -> Quick Actions -> Create Product (`/admin/catalog/new`)
- Shipping Settings: Dashboard -> Quick Actions -> Shipping Settings (`/admin/shipping-rules`)
- Payment Settings: Dashboard -> Quick Actions -> Payment Settings (`/admin/payment-transfer-methods`)

### Keyboard-only pass
- Pass (implementation-level and route-flow validation)
- Sidebar and action controls are link/button based and reachable via tab order.
- Focusable controls remain actionable without pointer interactions.

### Focus order and visibility
- Pass (implementation-level)
- Components use visible focus states and semantic controls.
- No hidden keyboard trap found in dashboard shell path.

### Color + text redundancy
- Pass
- Status/priority information is represented by both text and visual treatment.
- Queue/help labels preserve meaning without color-only dependency.

## 4) Data Validation (Dashboard vs DB)

Validation script compared `getAdminOpsDashboard` output to direct Prisma aggregates/grouping for the same Yangon-aligned trailing window.

Observed comparison:

```json
{
  "dashboardSalesTotal": "203000",
  "dbSalesTotal": "203000",
  "dashboardSalesOrders": 2,
  "dbSalesOrders": 2,
  "dashboardRecent": [
    "MZT-20260224-193106B10EE3",
    "MZT-20260221-2313147AC189",
    "MZT-20260215-0001",
    "MZT-20260214-0007",
    "MZT-20260214-0006",
    "MZT-20260214-0005"
  ],
  "dbRecent": [
    "MZT-20260224-193106B10EE3",
    "MZT-20260221-2313147AC189",
    "MZT-20260215-0001",
    "MZT-20260214-0007",
    "MZT-20260214-0006",
    "MZT-20260214-0005"
  ],
  "dashboardTop": [
    {
      "productId": "529d4e8a-728f-4f69-8d42-c4ab33663e6b",
      "unitsSold": 2
    }
  ],
  "dbTop": [
    {
      "productId": "529d4e8a-728f-4f69-8d42-c4ab33663e6b",
      "unitsSold": 2
    }
  ]
}
```

Conclusion: Sales totals, order counts, top-product ranking, and recent-order freshness align with DB queries.

## 5) Performance Baseline (`/admin`)

Quick local baseline (10 requests to `http://localhost:3000/admin`):

- Samples (seconds): `0.0074, 0.0168, 0.0059, 0.3743, 0.0069, 0.0256, 0.0074, 0.0061, 0.0059, 0.0069`
- Average: `0.0463s`
- P95: `0.3743s` (single cold/outlier sample)

Notes:
- Warm requests are consistently low-latency.
- One cold sample outlier suggests startup/cache overhead; no immediate index action required from this run.

## 6) Deferred / Follow-up

- Real-device accessibility validation (screen readers + mobile behavior) deferred to:
  - `#111` A2.6 follow-up: Real-device accessibility QA for admin dashboard shell

No blocking defects found for `A2.6.5` scope.
