import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { getAdminOpsDashboard } from "@/server/services/admin-ops-dashboard.service";
import type { AdminOpsDashboardRepository } from "@/server/repositories/admin-ops-dashboard.repository";

function buildRepositoryMock(
  capture?: {
    dailyRange?: { start: Date; end: Date };
    salesRange?: { start: Date; end: Date };
    salesTimezone?: string;
    topProductsRange?: { start: Date; end: Date };
    topProductsLimit?: number;
    recentOrdersLimit?: number;
  },
): AdminOpsDashboardRepository {
  return {
    async countOrders(where) {
      if (where.status === OrderStatus.PENDING) {
        return 7;
      }
      if (where.status === OrderStatus.CONFIRMED) {
        return 4;
      }
      if (where.paymentStatus === PaymentStatus.PENDING_REVIEW) {
        return 3;
      }
      if (where.paymentStatus === PaymentStatus.REJECTED) {
        return 1;
      }
      return 0;
    },
    async listUrgentOrderCandidates() {
      return [
        {
          id: "order-confirmed",
          orderCode: "MZT-1",
          customerName: "Confirmed",
          status: OrderStatus.CONFIRMED,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.VERIFIED,
          totalAmount: new Prisma.Decimal("22000.00"),
          currency: "MMK",
          shippingZoneLabel: "Yangon",
          createdAt: new Date("2026-02-24T04:00:00.000Z"),
        },
        {
          id: "order-payment-review",
          orderCode: "MZT-2",
          customerName: "Payment Review",
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.PREPAID_TRANSFER,
          paymentStatus: PaymentStatus.PENDING_REVIEW,
          totalAmount: new Prisma.Decimal("35000.00"),
          currency: "MMK",
          shippingZoneLabel: "Mandalay",
          createdAt: new Date("2026-02-24T03:00:00.000Z"),
        },
      ];
    },
    async getDailyMetricsRange(range) {
      if (capture) {
        capture.dailyRange = range;
      }
      return {
        ordersToday: 12,
        revenueToday: new Prisma.Decimal("420000.00"),
        pendingPaymentReviews: 3,
      };
    },
    async getSalesOverviewSeries(params) {
      if (capture) {
        capture.salesRange = params.range;
        capture.salesTimezone = params.timezone;
      }
      return [
        { dayKey: "2026-02-19", salesAmount: new Prisma.Decimal("0"), ordersCount: 0 },
        { dayKey: "2026-02-20", salesAmount: new Prisma.Decimal("10000"), ordersCount: 1 },
        { dayKey: "2026-02-21", salesAmount: new Prisma.Decimal("25000"), ordersCount: 2 },
        { dayKey: "2026-02-22", salesAmount: new Prisma.Decimal("0"), ordersCount: 0 },
        { dayKey: "2026-02-23", salesAmount: new Prisma.Decimal("5000"), ordersCount: 1 },
        { dayKey: "2026-02-24", salesAmount: new Prisma.Decimal("0"), ordersCount: 0 },
        { dayKey: "2026-02-25", salesAmount: new Prisma.Decimal("0"), ordersCount: 0 },
      ];
    },
    async listTopProducts(params) {
      if (capture) {
        capture.topProductsRange = params.range;
        capture.topProductsLimit = params.limit;
      }
      return [
        {
          productId: "product-1",
          slug: "midnight-bloom",
          name: "Midnight Bloom Blazer Set",
          thumbnailUrl: "https://example.com/p1.jpg",
          unitsSold: 4,
          salesAmount: new Prisma.Decimal("60000"),
        },
      ];
    },
    async listRecentOrders(params) {
      if (capture) {
        capture.recentOrdersLimit = params.limit;
      }
      return [
        {
          orderId: "order-1",
          orderCode: "MZT-20260224-000001AAAAAA",
          customerName: "Aye Aye",
          createdAt: new Date("2026-02-24T06:00:00.000Z"),
          paymentMethod: PaymentMethod.COD,
          status: OrderStatus.PENDING,
          totalAmount: new Prisma.Decimal("15000"),
          currency: "MMK",
        },
      ];
    },
  };
}

describe("admin ops dashboard service", () => {
  it("returns typed queue summaries with deep links", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.queues).toHaveLength(4);
    expect(data.queues[0]).toMatchObject({
      id: "new_orders",
      label: "New Orders",
      count: 7,
      href: "/admin/orders?status=PENDING&page=1&pageSize=20",
    });
    expect(data.queues[1]).toMatchObject({
      id: "pending_payment_review",
      count: 3,
      href: "/admin/orders?paymentStatus=PENDING_REVIEW&page=1&pageSize=20",
    });
  });

  it("orchestrates sales overview, top products, and recent orders from repository data", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.salesOverview).toMatchObject({
      totalSales: "40000",
      totalOrders: 4,
      currency: "MMK",
      rangeLabel: "Last 7 days",
    });
    expect(data.salesOverview.series).toHaveLength(7);

    expect(data.topProducts).toEqual([
      {
        productId: "product-1",
        slug: "midnight-bloom",
        name: "Midnight Bloom Blazer Set",
        thumbnailUrl: "https://example.com/p1.jpg",
        unitsSold: 4,
        salesAmount: "60000",
        currency: "MMK",
      },
    ]);

    expect(data.recentOrders[0]).toMatchObject({
      orderId: "order-1",
      orderCode: "MZT-20260224-000001AAAAAA",
      paymentMethod: PaymentMethod.COD,
      status: OrderStatus.PENDING,
      totalAmount: "15000",
      currency: "MMK",
    });
    expect(data.recentOrders[0].createdAt).toBe("2026-02-24T06:00:00.000Z");
  });

  it("uses Yangon day boundaries and expected query params for repository calls", async () => {
    const capture: {
      dailyRange?: { start: Date; end: Date };
      salesRange?: { start: Date; end: Date };
      salesTimezone?: string;
      topProductsRange?: { start: Date; end: Date };
      topProductsLimit?: number;
      recentOrdersLimit?: number;
    } = {};

    await getAdminOpsDashboard({
      repository: buildRepositoryMock(capture),
      now: new Date("2026-02-24T20:00:00.000Z"),
    });

    expect(capture.dailyRange?.start.toISOString()).toBe("2026-02-24T17:30:00.000Z");
    expect(capture.dailyRange?.end.toISOString()).toBe("2026-02-25T17:29:59.999Z");

    expect(capture.salesTimezone).toBe("Asia/Yangon");
    expect(capture.salesRange?.start.toISOString()).toBe("2026-02-18T17:30:00.000Z");
    expect(capture.salesRange?.end.toISOString()).toBe("2026-02-25T17:29:59.999Z");

    expect(capture.topProductsRange?.start.toISOString()).toBe("2026-02-18T17:30:00.000Z");
    expect(capture.topProductsRange?.end.toISOString()).toBe("2026-02-25T17:29:59.999Z");
    expect(capture.topProductsLimit).toBe(5);
    expect(capture.recentOrdersLimit).toBe(6);
  });

  it("still prioritizes urgent orders by payment review then age", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.urgentOrders.map((item) => item.orderId)).toEqual([
      "order-payment-review",
      "order-confirmed",
    ]);
  });
});
