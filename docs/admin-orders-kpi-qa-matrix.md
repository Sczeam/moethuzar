# Admin Orders KPI QA Matrix (A3.6.5)

Last updated: 2026-02-25

## Scope

Validate Orders page KPI correctness across filter states after A3.6 KPI contract rollout.

Contract references:
- `lib/constants/admin-orders-kpi-contract.ts`
- `server/domain/orders-kpi.ts`

Formula:
- numerator statuses: `DELIVERED`
- denominator statuses: `CONFIRMED`, `DELIVERING`, `DELIVERED`, `CANCELLED`
- `fulfillmentRate = denominator === 0 ? 0 : (numerator / denominator) * 100`

## Matrix

| Scenario | Query input | Expected scope | Expected KPI behavior |
|---|---|---|---|
| Baseline no filters | no `status`, no `paymentStatus`, no `q`, no `from`, no `to` | `ALL_TIME` | Uses full dataset totals. |
| Status-filtered | `status=PENDING` (or any status) | `FILTERED` | Totals and averages reflect only status subset. |
| Payment-filtered | `paymentStatus=PENDING_REVIEW` | `FILTERED` | Totals and rates reflect only payment subset. |
| Search-filtered | `q=<order code or customer>` | `FILTERED` | Totals/rates limited to search result set. |
| Date-range filtered | `from` and/or `to` set | `FILTERED` | Totals/rates limited to date range. |
| Zero-result filter | `q` that matches no rows | `FILTERED` | `totalOrders=0`, `totalRevenue=0`, `avgOrder=0`, `fulfillmentRate=0`. |

## Regression checklist

1. KPI cards render from server contract (`OrdersKpiSnapshot`), not local row math.
2. Changing filters updates both table and KPI values from same filter source.
3. Pagination changes table rows only; KPI scope/values remain based on active filters.
4. No `any` typing in KPI path (`page -> service -> client`).

## Automated coverage

- `server/domain/orders-kpi.test.ts`
- `server/repositories/admin-orders-list.repository.integration.test.ts`
- `server/services/admin-orders-list.integration.test.ts`

