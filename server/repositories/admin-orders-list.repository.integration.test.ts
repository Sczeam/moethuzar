import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true" ? process.env.RUN_INTEGRATION_TESTS === "1" : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("admin orders KPI repository integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const orderCodePrefix = `MZT-IT-KPI-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let enums: typeof import("@prisma/client");
  let buildAdminOrdersWhere: (typeof import("@/server/repositories/admin-orders-list.repository"))["buildAdminOrdersWhere"];
  let repository: (typeof import("@/server/repositories/admin-orders-list.repository"))["prismaAdminOrdersListRepository"];

  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    enums = await import("@prisma/client");
    ({ buildAdminOrdersWhere, prismaAdminOrdersListRepository: repository } = await import(
      "@/server/repositories/admin-orders-list.repository"
    ));

    async function createOrder(params: {
      index: number;
      status: (typeof enums.OrderStatus)[keyof typeof enums.OrderStatus];
      amount: string;
      customerName: string;
    }) {
      const created = await prisma.order.create({
        data: {
          orderCode: `${orderCodePrefix}-${params.index}`,
          status: params.status,
          paymentMethod: enums.PaymentMethod.COD,
          paymentStatus: enums.PaymentStatus.NOT_REQUIRED,
          currency: "MMK",
          subtotalAmount: params.amount,
          deliveryFeeAmount: "0",
          totalAmount: params.amount,
          customerName: params.customerName,
          customerPhone: `0999912${params.index}`,
          address: {
            create: {
              country: "Myanmar",
              stateRegion: "Yangon Region",
              townshipCity: "Yangon",
              addressLine1: "KPI Repo Integration",
            },
          },
        },
      });
      createdOrderIds.push(created.id);
    }

    await createOrder({ index: 1, status: enums.OrderStatus.DELIVERED, amount: "10000", customerName: "KPI Delivered A" });
    await createOrder({ index: 2, status: enums.OrderStatus.CONFIRMED, amount: "20000", customerName: "KPI Confirmed B" });
    await createOrder({ index: 3, status: enums.OrderStatus.CANCELLED, amount: "30000", customerName: "KPI Cancelled C" });
    await createOrder({ index: 4, status: enums.OrderStatus.PENDING, amount: "40000", customerName: "KPI Pending D" });
  });

  afterAll(async () => {
    if (!prisma || createdOrderIds.length === 0) {
      return;
    }

    await prisma.orderAddress.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  });

  it("aggregates KPI values with optimized counts and sums", async () => {
    const where = buildAdminOrdersWhere({
      status: undefined,
      paymentStatus: undefined,
      q: orderCodePrefix,
      from: undefined,
      to: undefined,
    });

    const kpis = await repository.getOrdersKpiAggregates(where);

    expect(kpis.totalOrders).toBe(4);
    expect(kpis.totalRevenueAmount.toString()).toBe("100000");
    expect(kpis.averageOrderValueAmount.toString()).toBe("25000");
    expect(kpis.deliveredCount).toBe(1);
    expect(kpis.eligibleCount).toBe(3);
  });

  it("applies status filters to KPI aggregates", async () => {
    const where = buildAdminOrdersWhere({
      status: enums.OrderStatus.PENDING,
      paymentStatus: undefined,
      q: orderCodePrefix,
      from: undefined,
      to: undefined,
    });

    const kpis = await repository.getOrdersKpiAggregates(where);
    expect(kpis.totalOrders).toBe(1);
    expect(kpis.totalRevenueAmount.toString()).toBe("40000");
    expect(kpis.averageOrderValueAmount.toString()).toBe("40000");
    expect(kpis.deliveredCount).toBe(0);
    expect(kpis.eligibleCount).toBe(0);
  });

  it("returns zero-safe aggregate payload for empty datasets", async () => {
    const where = buildAdminOrdersWhere({
      status: undefined,
      paymentStatus: undefined,
      q: `${orderCodePrefix}-NO-MATCH`,
      from: undefined,
      to: undefined,
    });

    const kpis = await repository.getOrdersKpiAggregates(where);
    expect(kpis.totalOrders).toBe(0);
    expect(kpis.totalRevenueAmount.toString()).toBe("0");
    expect(kpis.averageOrderValueAmount.toString()).toBe("0");
    expect(kpis.deliveredCount).toBe(0);
    expect(kpis.eligibleCount).toBe(0);
  });
});

