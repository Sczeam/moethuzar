import type {
  AdminOpsDashboardRepository,
  OpsOrderSummary,
} from "@/server/repositories/admin-ops-dashboard.repository";
import { prismaAdminOpsDashboardRepository } from "@/server/repositories/admin-ops-dashboard.repository";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

type QueueId =
  | "new_orders"
  | "pending_payment_review"
  | "ready_to_fulfill"
  | "needs_attention";

export type DashboardQueueSummary = {
  id: QueueId;
  label: string;
  count: number;
  href: string;
  priority: 1 | 2 | 3;
  helpText: string;
};

export type UrgentOrderItem = {
  orderId: string;
  orderCode: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  currency: string;
  zoneLabel: string | null;
  createdAt: string;
  href: string;
};

export type DailyOpsMetrics = {
  ordersToday: number;
  revenueToday: string;
  pendingPaymentReviews: number;
  currency: "MMK";
  refreshedAt: string;
};

export type AdminOpsDashboardPayload = {
  queues: DashboardQueueSummary[];
  urgentOrders: UrgentOrderItem[];
  dailyMetrics: DailyOpsMetrics;
};

type QueueDefinition = {
  id: QueueId;
  label: string;
  priority: 1 | 2 | 3;
  helpText: string;
  query: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  };
};

const queueDefinitions: QueueDefinition[] = [
  {
    id: "new_orders",
    label: "New Orders",
    priority: 1,
    helpText: "Needs first response and customer confirmation.",
    query: {
      status: OrderStatus.PENDING,
    },
  },
  {
    id: "pending_payment_review",
    label: "Pending Payment Review",
    priority: 1,
    helpText: "Verify uploaded transfer proof before processing.",
    query: {
      paymentStatus: PaymentStatus.PENDING_REVIEW,
    },
  },
  {
    id: "ready_to_fulfill",
    label: "Ready to Fulfill",
    priority: 2,
    helpText: "Confirmed orders that should move to delivery.",
    query: {
      status: OrderStatus.CONFIRMED,
    },
  },
  {
    id: "needs_attention",
    label: "Needs Attention",
    priority: 3,
    helpText: "Orders with rejected transfer that require follow-up.",
    query: {
      paymentStatus: PaymentStatus.REJECTED,
    },
  },
];

function buildOrdersHref(query: QueueDefinition["query"]): string {
  const searchParams = new URLSearchParams();
  if (query.status) {
    searchParams.set("status", query.status);
  }
  if (query.paymentStatus) {
    searchParams.set("paymentStatus", query.paymentStatus);
  }
  searchParams.set("page", "1");
  searchParams.set("pageSize", "20");

  return `/admin/orders?${searchParams.toString()}`;
}

function toUrgentPriority(item: OpsOrderSummary): number {
  if (item.paymentStatus === PaymentStatus.PENDING_REVIEW) {
    return 1;
  }
  if (item.status === OrderStatus.PENDING) {
    return 2;
  }
  if (item.status === OrderStatus.CONFIRMED) {
    return 3;
  }
  return 4;
}

function toDayRange(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getAdminOpsDashboard(
  deps: { repository?: AdminOpsDashboardRepository; now?: Date } = {},
): Promise<AdminOpsDashboardPayload> {
  const repository = deps.repository ?? prismaAdminOpsDashboardRepository;
  const now = deps.now ?? new Date();

  const queueCounts = await Promise.all(
    queueDefinitions.map((definition) =>
      repository.countOrders({
        status: definition.query.status,
        paymentStatus: definition.query.paymentStatus,
      }),
    ),
  );

  const queues: DashboardQueueSummary[] = queueDefinitions.map((definition, index) => ({
    id: definition.id,
    label: definition.label,
    count: queueCounts[index],
    href: buildOrdersHref(definition.query),
    priority: definition.priority,
    helpText: definition.helpText,
  }));

  const urgentCandidates = await repository.listUrgentOrderCandidates(20);
  const urgentOrders: UrgentOrderItem[] = urgentCandidates
    .sort((a, b) => {
      const priorityDiff = toUrgentPriority(a) - toUrgentPriority(b);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 5)
    .map((item) => ({
      orderId: item.id,
      orderCode: item.orderCode,
      customerName: item.customerName,
      status: item.status,
      paymentMethod: item.paymentMethod,
      paymentStatus: item.paymentStatus,
      totalAmount: item.totalAmount.toString(),
      currency: item.currency,
      zoneLabel: item.shippingZoneLabel,
      createdAt: item.createdAt.toISOString(),
      href: `/admin/orders/${item.id}`,
    }));

  const daily = await repository.getDailyMetricsRange(toDayRange(now));
  const dailyMetrics: DailyOpsMetrics = {
    ordersToday: daily.ordersToday,
    revenueToday: daily.revenueToday.toString(),
    pendingPaymentReviews: daily.pendingPaymentReviews,
    currency: "MMK",
    refreshedAt: now.toISOString(),
  };

  return {
    queues,
    urgentOrders,
    dailyMetrics,
  };
}
