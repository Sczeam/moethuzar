import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
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
          paymentStatus: PaymentStatus.VERIFIED,
          createdAt: new Date("2026-02-24T04:00:00.000Z"),
        },
        {
          id: "order-payment-review",
          orderCode: "MZT-2",
          customerName: "Payment Review",
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING_REVIEW,
          createdAt: new Date("2026-02-24T03:00:00.000Z"),
        },
        {
          id: "order-pending",
          orderCode: "MZT-3",
          customerName: "Pending",
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.NOT_REQUIRED,
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
});
