import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

export type OpsOrderSummary = {
  id: string;
  orderCode: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: Prisma.Decimal;
  currency: string;
  shippingZoneLabel: string | null;
  createdAt: Date;
};

export type OpsSalesOverviewPoint = {
  dayKey: string;
  salesAmount: Prisma.Decimal;
  ordersCount: number;
};

export type OpsTopProductSummary = {
  productId: string;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  unitsSold: number;
  salesAmount: Prisma.Decimal;
};

export type OpsRecentOrderSummary = {
  orderId: string;
  orderCode: string;
  customerName: string;
  createdAt: Date;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totalAmount: Prisma.Decimal;
  currency: string;
};

export type AdminOpsDashboardRepository = {
  countOrders(where: Prisma.OrderWhereInput): Promise<number>;
  listUrgentOrderCandidates(limit: number): Promise<OpsOrderSummary[]>;
  getDailyMetricsRange(range: { start: Date; end: Date }): Promise<{
    ordersToday: number;
    revenueToday: Prisma.Decimal;
    pendingPaymentReviews: number;
  }>;
  getSalesOverviewSeries(params: {
    range: { start: Date; end: Date };
    timezone: string;
  }): Promise<OpsSalesOverviewPoint[]>;
  listTopProducts(params: {
    range: { start: Date; end: Date };
    limit: number;
  }): Promise<OpsTopProductSummary[]>;
  listRecentOrders(params: {
    limit: number;
  }): Promise<OpsRecentOrderSummary[]>;
};

const defaultUrgentWhere: Prisma.OrderWhereInput = {
  OR: [
    { paymentStatus: PaymentStatus.PENDING_REVIEW },
    { status: OrderStatus.PENDING },
    { status: OrderStatus.CONFIRMED },
  ],
};

const eligibleFinancialOrderWhere: Prisma.OrderWhereInput = {
  status: {
    not: OrderStatus.CANCELLED,
  },
  OR: [
    {
      paymentMethod: PaymentMethod.COD,
    },
    {
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.VERIFIED,
    },
  ],
};

function toDayKeyInTimeZone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildDayKeysInRange(range: { start: Date; end: Date }, timezone: string): string[] {
  const result: string[] = [];
  const cursor = new Date(range.start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    result.push(toDayKeyInTimeZone(cursor, timezone));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export const prismaAdminOpsDashboardRepository: AdminOpsDashboardRepository = {
  async countOrders(where) {
    return prisma.order.count({ where });
  },

  async listUrgentOrderCandidates(limit) {
    return prisma.order.findMany({
      where: defaultUrgentWhere,
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        totalAmount: true,
        currency: true,
        shippingZoneLabel: true,
        createdAt: true,
      },
    });
  },

  async getDailyMetricsRange(range) {
    const createdAt: Prisma.DateTimeFilter = {
      gte: range.start,
      lte: range.end,
    };

    const [ordersToday, revenueTodayAggregate, pendingPaymentReviews] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt,
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt,
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.count({
        where: {
          createdAt,
          paymentStatus: PaymentStatus.PENDING_REVIEW,
        },
      }),
    ]);

    return {
      ordersToday,
      revenueToday: revenueTodayAggregate._sum.totalAmount ?? new Prisma.Decimal(0),
      pendingPaymentReviews,
    };
  },

  async getSalesOverviewSeries(params) {
    const { range, timezone } = params;

    const orders = await prisma.order.findMany({
      where: {
        ...eligibleFinancialOrderWhere,
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const dayKeys = buildDayKeysInRange(range, timezone);
    const totalsByDay = new Map<string, { salesAmount: Prisma.Decimal; ordersCount: number }>(
      dayKeys.map((dayKey) => [dayKey, { salesAmount: new Prisma.Decimal(0), ordersCount: 0 }]),
    );

    for (const order of orders) {
      const dayKey = toDayKeyInTimeZone(order.createdAt, timezone);
      const current = totalsByDay.get(dayKey);
      if (!current) {
        continue;
      }

      totalsByDay.set(dayKey, {
        salesAmount: current.salesAmount.plus(order.totalAmount),
        ordersCount: current.ordersCount + 1,
      });
    }

    return dayKeys.map((dayKey) => {
      const day = totalsByDay.get(dayKey) ?? {
        salesAmount: new Prisma.Decimal(0),
        ordersCount: 0,
      };

      return {
        dayKey,
        salesAmount: day.salesAmount,
        ordersCount: day.ordersCount,
      };
    });
  },

  async listTopProducts(params) {
    const grouped = await prisma.orderItem.groupBy({
      by: ["productId", "productSlug", "productName"],
      where: {
        productId: {
          not: null,
        },
        order: {
          ...eligibleFinancialOrderWhere,
          createdAt: {
            gte: params.range.start,
            lte: params.range.end,
          },
        },
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
    });

    if (grouped.length === 0) {
      return [];
    }

    const productIds = Array.from(
      new Set(
        grouped
          .map((row) => row.productId)
          .filter((id): id is string => typeof id === "string"),
      ),
    );

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: {
            url: true,
          },
        },
      },
    });

    const thumbnailByProductId = new Map<string, string | null>(
      products.map((product) => [product.id, product.images[0]?.url ?? null]),
    );

    return grouped
      .map((row) => {
        const unitsSold = row._sum.quantity ?? 0;
        const salesAmount = row._sum.lineTotal ?? new Prisma.Decimal(0);

        return {
          productId: row.productId ?? "",
          slug: row.productSlug,
          name: row.productName,
          thumbnailUrl: row.productId ? (thumbnailByProductId.get(row.productId) ?? null) : null,
          unitsSold,
          salesAmount,
        };
      })
      .filter((item) => item.productId !== "")
      .sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) {
          return b.unitsSold - a.unitsSold;
        }

        const amountDiff = b.salesAmount.minus(a.salesAmount);
        if (!amountDiff.isZero()) {
          return amountDiff.gt(0) ? 1 : -1;
        }

        return a.name.localeCompare(b.name, "en");
      })
      .slice(0, params.limit);
  },

  async listRecentOrders(params) {
    const rows = await prisma.order.findMany({
      where: eligibleFinancialOrderWhere,
      orderBy: {
        createdAt: "desc",
      },
      take: params.limit,
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        createdAt: true,
        paymentMethod: true,
        status: true,
        totalAmount: true,
        currency: true,
      },
    });

    return rows.map((row) => ({
      orderId: row.id,
      orderCode: row.orderCode,
      customerName: row.customerName,
      createdAt: row.createdAt,
      paymentMethod: row.paymentMethod,
      status: row.status,
      totalAmount: row.totalAmount,
      currency: row.currency,
    }));
  },
};
