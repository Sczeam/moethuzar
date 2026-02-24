import type {
  AdminOpsDashboardRepository,
  OpsOrderSummary,
  OpsSalesOverviewPoint,
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

export type SalesOverviewPoint = {
  dayKey: string;
  salesAmount: string;
  ordersCount: number;
};

export type SalesOverview = {
  totalSales: string;
  totalOrders: number;
  currency: "MMK";
  rangeLabel: string;
  series: SalesOverviewPoint[];
};

export type TopProductSummary = {
  productId: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  unitsSold: number;
  salesAmount: string;
  currency: "MMK";
};

export type RecentOrderSummary = {
  orderId: string;
  orderCode: string;
  customerName: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totalAmount: string;
  currency: "MMK";
};

export type AdminOpsDashboardPayload = {
  queues: DashboardQueueSummary[];
  urgentOrders: UrgentOrderItem[];
  dailyMetrics: DailyOpsMetrics;
  salesOverview: SalesOverview;
  topProducts: TopProductSummary[];
  recentOrders: RecentOrderSummary[];
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

const YANGON_TIMEZONE = "Asia/Yangon";
const YANGON_UTC_OFFSET_MINUTES = 6 * 60 + 30;
const SALES_OVERVIEW_DAYS = 7;
const TOP_PRODUCTS_LIMIT = 5;
const RECENT_ORDERS_LIMIT = 6;

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

function toYangonDayRange(now: Date): { start: Date; end: Date } {
  const offsetMs = YANGON_UTC_OFFSET_MINUTES * 60_000;
  const shifted = new Date(now.getTime() + offsetMs);

  const startShifted = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const endShifted = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  const start = new Date(startShifted.getTime() - offsetMs);
  const end = new Date(endShifted.getTime() - offsetMs);

  return { start, end };
}

function toYangonTrailingDaysRange(now: Date, days: number): { start: Date; end: Date } {
  const dayRange = toYangonDayRange(now);
  const start = new Date(dayRange.start);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  return {
    start,
    end: dayRange.end,
  };
}

function toSalesOverviewFromSeries(
  series: OpsSalesOverviewPoint[],
): SalesOverview {
  let totalOrders = 0;
  let totalSales = 0;

  const points: SalesOverviewPoint[] = series.map((point) => {
    const numericSales = Number(point.salesAmount.toString());
    totalSales += numericSales;
    totalOrders += point.ordersCount;

    return {
      dayKey: point.dayKey,
      salesAmount: point.salesAmount.toString(),
      ordersCount: point.ordersCount,
    };
  });

  return {
    totalSales: String(totalSales),
    totalOrders,
    currency: "MMK",
    rangeLabel: `Last ${SALES_OVERVIEW_DAYS} days`,
    series: points,
  };
}

export async function getAdminOpsDashboard(
  deps: { repository?: AdminOpsDashboardRepository; now?: Date } = {},
): Promise<AdminOpsDashboardPayload> {
  const repository = deps.repository ?? prismaAdminOpsDashboardRepository;
  const now = deps.now ?? new Date();
  const todayRange = toYangonDayRange(now);
  const trailingRange = toYangonTrailingDaysRange(now, SALES_OVERVIEW_DAYS);

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

  const [daily, salesSeries, topProductsRaw, recentOrdersRaw] = await Promise.all([
    repository.getDailyMetricsRange(todayRange),
    repository.getSalesOverviewSeries({
      range: trailingRange,
      timezone: YANGON_TIMEZONE,
    }),
    repository.listTopProducts({
      range: trailingRange,
      limit: TOP_PRODUCTS_LIMIT,
    }),
    repository.listRecentOrders({
      limit: RECENT_ORDERS_LIMIT,
    }),
  ]);

  const dailyMetrics: DailyOpsMetrics = {
    ordersToday: daily.ordersToday,
    revenueToday: daily.revenueToday.toString(),
    pendingPaymentReviews: daily.pendingPaymentReviews,
    currency: "MMK",
    refreshedAt: now.toISOString(),
  };

  const topProducts: TopProductSummary[] = topProductsRaw.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    thumbnailUrl: item.thumbnailUrl,
    unitsSold: item.unitsSold,
    salesAmount: item.salesAmount.toString(),
    currency: "MMK",
  }));

  const recentOrders: RecentOrderSummary[] = recentOrdersRaw.map((item) => ({
    orderId: item.orderId,
    orderCode: item.orderCode,
    customerName: item.customerName,
    createdAt: item.createdAt.toISOString(),
    paymentMethod: item.paymentMethod,
    status: item.status,
    totalAmount: item.totalAmount.toString(),
    currency: "MMK",
  }));

  return {
    queues,
    urgentOrders,
    dailyMetrics,
    salesOverview: toSalesOverviewFromSeries(salesSeries),
    topProducts,
    recentOrders,
  };
}
