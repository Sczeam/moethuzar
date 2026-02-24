# A2 Plan: Order Operations Dashboard

Last updated: 2026-02-24  
Parent issue: #76

## Objective

Provide a one-screen operational dashboard for non-technical staff to handle daily order work quickly:
- what needs action now
- what is urgent
- one-click path to act

## Sub-issues

- `#90` A2.1: Dashboard data contract + aggregation service
- `#91` A2.2: Task-first queue cards on admin dashboard
- `#92` A2.3: Urgent actions lane (top 5 actionable orders)
- `#93` A2.4: Daily summary metrics strip
- `#94` A2.5: Ops dashboard usability + accessibility QA

## SOLID Design Rules (for A2)

### 1) SRP (Primary)
- `server/services/admin-ops-dashboard.service.ts`:
  - orchestration and aggregation only
- `server/repositories/admin-ops-dashboard.repository.ts`:
  - data retrieval only
- `components/admin/dashboard/*`:
  - rendering only
- `lib/admin/dashboard/formatters.ts`:
  - formatting only

### 2) OCP
- Queue cards should be built from a queue-definition list.
- Add new queue type by appending config, not rewriting dashboard page logic.

### 3) DIP
- Dashboard page depends on service contract/DTOs, not Prisma model shape.
- Repository implementation can change later without page refactor.

### 4) ISP
- Separate DTOs by UI section:
  - `DashboardQueueSummary`
  - `UrgentOrderItem`
  - `DailyOpsMetrics`

## Target Information Architecture on `/admin`

1. Queue cards (highest priority)
- New Orders
- Pending Payment Review
- Ready to Fulfill
- Needs Attention

2. Urgent actions list
- Top 5 orders needing immediate action
- Fast jump to order detail

3. Daily summary strip
- Orders today
- Revenue today
- Pending payment reviews

## Data Contract (A2.1)

```ts
type DashboardQueueSummary = {
  id: "new_orders" | "pending_payment_review" | "ready_to_fulfill" | "needs_attention";
  label: string;
  count: number;
  href: string;
  priority: 1 | 2 | 3;
  helpText: string;
};

type UrgentOrderItem = {
  orderId: string;
  orderCode: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  href: string;
};

type DailyOpsMetrics = {
  ordersToday: number;
  revenueToday: string;
  pendingPaymentReviews: number;
  currency: string;
  refreshedAt: string;
};

type AdminOpsDashboardPayload = {
  queues: DashboardQueueSummary[];
  urgentOrders: UrgentOrderItem[];
  dailyMetrics: DailyOpsMetrics;
};
```

## Execution Order

1. A2.1
- Implement repository + service + types.
- Return one payload for all dashboard sections.

2. A2.2
- Render queue cards from `queues`.
- CTA opens filtered orders page in one click.

3. A2.3
- Render urgent list from `urgentOrders`.
- Oldest/highest-risk first.

4. A2.4
- Render summary strip from `dailyMetrics`.
- Include refresh timestamp.

5. A2.5
- Usability + accessibility QA.
- Patch issues, record report, close.

## Acceptance Criteria

1. Core order actions reachable in <= 2 clicks from dashboard.
2. Queue counts and deep links match orders page filtered results.
3. Dashboard uses one server-side payload (no fragmented client fetches).
4. UI labels are plain-language and non-technical.
5. Keyboard navigation and focus visibility pass.

## Non-goals (A2)

- No order-detail behavior redesign (handled in A3).
- No catalog/settings redesign (handled in later phases).
- No major analytics/reporting expansion.
