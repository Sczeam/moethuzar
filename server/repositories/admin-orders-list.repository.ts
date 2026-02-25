import { prisma } from "@/lib/prisma";
import {
  FULFILLMENT_DENOMINATOR_STATUSES,
  FULFILLMENT_NUMERATOR_STATUSES,
} from "@/lib/constants/admin-orders-kpi-contract";
import type { AdminOrdersListQueryInput } from "@/lib/validation/admin-order";
import { OrderStatus, Prisma, type Prisma as PrismaType } from "@prisma/client";

export type AdminOrdersFilterInput = Pick<
  AdminOrdersListQueryInput,
  "status" | "paymentStatus" | "q" | "from" | "to"
>;

export type OrdersKpiAggregateRow = {
  totalOrders: number;
  totalRevenueAmount: Prisma.Decimal;
  averageOrderValueAmount: Prisma.Decimal;
  deliveredCount: number;
  eligibleCount: number;
};

function parseStartDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseEndDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

export function buildAdminOrdersWhere(query: AdminOrdersFilterInput): Prisma.OrderWhereInput {
  const where: PrismaType.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.paymentStatus) {
    where.paymentStatus = query.paymentStatus;
  }

  const search = query.q?.trim();
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const createdAt: PrismaType.DateTimeFilter = {};
  const fromDate = parseStartDate(query.from);
  if (fromDate) {
    createdAt.gte = fromDate;
  }

  const toDate = parseEndDate(query.to);
  if (toDate) {
    createdAt.lte = toDate;
  }

  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  return where;
}

function buildWhereWithStatusConstraint(
  baseWhere: Prisma.OrderWhereInput,
  statuses: readonly string[],
): Prisma.OrderWhereInput {
  return {
    AND: [
      baseWhere,
      {
        status: {
          in: statuses as OrderStatus[],
        },
      },
    ],
  };
}

export const prismaAdminOrdersListRepository = {
  async getOrdersKpiAggregates(where: Prisma.OrderWhereInput): Promise<OrdersKpiAggregateRow> {
    const [totalOrders, revenueAvgAggregate, deliveredCount, eligibleCount] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
      }),
      prisma.order.count({
        where: buildWhereWithStatusConstraint(where, FULFILLMENT_NUMERATOR_STATUSES),
      }),
      prisma.order.count({
        where: buildWhereWithStatusConstraint(where, FULFILLMENT_DENOMINATOR_STATUSES),
      }),
    ]);

    return {
      totalOrders,
      totalRevenueAmount: revenueAvgAggregate._sum.totalAmount ?? new Prisma.Decimal(0),
      averageOrderValueAmount: revenueAvgAggregate._avg.totalAmount ?? new Prisma.Decimal(0),
      deliveredCount,
      eligibleCount,
    };
  },
};
