import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

export type OpsOrderSummary = {
  id: string;
  orderCode: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
};

export type AdminOpsDashboardRepository = {
  countOrders(where: Prisma.OrderWhereInput): Promise<number>;
  listUrgentOrderCandidates(limit: number): Promise<OpsOrderSummary[]>;
  getDailyMetricsRange(range: { start: Date; end: Date }): Promise<{
    ordersToday: number;
    revenueToday: Prisma.Decimal;
    pendingPaymentReviews: number;
  }>;
};

const defaultUrgentWhere: Prisma.OrderWhereInput = {
  OR: [
    { paymentStatus: PaymentStatus.PENDING_REVIEW },
    { status: OrderStatus.PENDING },
    { status: OrderStatus.CONFIRMED },
  ],
};

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
        paymentStatus: true,
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
};
