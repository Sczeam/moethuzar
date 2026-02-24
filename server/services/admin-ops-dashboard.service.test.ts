import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { getAdminOpsDashboard } from "@/server/services/admin-ops-dashboard.service";
import type { AdminOpsDashboardRepository } from "@/server/repositories/admin-ops-dashboard.repository";

function buildRepositoryMock(): AdminOpsDashboardRepository {
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
        {
          id: "order-pending",
          orderCode: "MZT-3",
          customerName: "Pending",
          status: OrderStatus.PENDING,
          paymentMethod: PaymentMethod.COD,
          paymentStatus: PaymentStatus.NOT_REQUIRED,
          totalAmount: new Prisma.Decimal("15000.00"),
          currency: "MMK",
          shippingZoneLabel: null,
          createdAt: new Date("2026-02-24T02:00:00.000Z"),
        },
      ];
    },
    async getDailyMetricsRange() {
      return {
        ordersToday: 12,
        revenueToday: new Prisma.Decimal("420000.00"),
        pendingPaymentReviews: 3,
      };
    },
    async getSalesOverviewSeries() {
      return [];
    },
    async listTopProducts() {
      return [];
    },
    async listRecentOrders() {
      return [];
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
    expect(data.salesOverview).toMatchObject({
      totalSales: "420000",
      totalOrders: 12,
      currency: "MMK",
      rangeLabel: "Last 7 days",
    });
    expect(data.salesOverview.series).toHaveLength(7);
    expect(data.topProducts).toEqual([]);
    expect(data.recentOrders).toEqual([]);
  });

  it("prioritizes urgent orders by payment review then pending age", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.urgentOrders.map((item) => item.orderId)).toEqual([
      "order-payment-review",
      "order-pending",
      "order-confirmed",
    ]);
  });

  it("returns enriched urgent order fields for operator triage", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.urgentOrders[0]).toMatchObject({
      orderId: "order-payment-review",
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.PENDING_REVIEW,
      totalAmount: "35000",
      currency: "MMK",
      zoneLabel: "Mandalay",
      href: "/admin/orders/order-payment-review",
    });
  });

  it("returns contract-safe defaults for newly added dashboard modules", async () => {
    const data = await getAdminOpsDashboard({
      repository: buildRepositoryMock(),
      now: new Date("2026-02-24T06:00:00.000Z"),
    });

    expect(data.salesOverview.series.every((point) => point.salesAmount === "0")).toBe(true);
    expect(data.salesOverview.series.every((point) => point.ordersCount === 0)).toBe(true);
    expect(data.topProducts).toHaveLength(0);
    expect(data.recentOrders).toHaveLength(0);
  });
});
