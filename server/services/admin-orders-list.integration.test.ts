import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true" ? process.env.RUN_INTEGRATION_TESTS === "1" : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("admin orders list integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const baseCode = `MZT-IT-LIST-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let listOrders: (typeof import("@/server/services/admin-order.service"))["listOrders"];
  let listOrdersWithKpis: (typeof import("@/server/services/admin-order.service"))["listOrdersWithKpis"];
  let enums: typeof import("@prisma/client");

  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({ listOrders, listOrdersWithKpis } = await import("@/server/services/admin-order.service"));
    enums = await import("@prisma/client");

    const createBaseOrder = async (index: number, paymentStatus: (typeof enums.PaymentStatus)[keyof typeof enums.PaymentStatus]) => {
      const order = await prisma.order.create({
        data: {
          orderCode: `${baseCode}-${index}`,
          status: enums.OrderStatus.PENDING,
          paymentMethod: enums.PaymentMethod.PREPAID_TRANSFER,
          paymentStatus,
          paymentProofUrl: `https://example.com/proof-${suffix}-${index}.jpg`,
          paymentReference: `KBZPAY:${suffix}${index}`,
          paymentSubmittedAt: new Date(),
          currency: "MMK",
          subtotalAmount: "10000",
          deliveryFeeAmount: "1000",
          totalAmount: "11000",
          customerName: `List Test ${index}`,
          customerPhone: `09999999${index}`,
          address: {
            create: {
              country: "Myanmar",
              stateRegion: "Mandalay Region",
              townshipCity: "Mandalay",
              addressLine1: `No. ${index}, Integration Street`,
            },
          },
        },
      });
      createdOrderIds.push(order.id);
    };

    await createBaseOrder(1, enums.PaymentStatus.PENDING_REVIEW);
    await createBaseOrder(2, enums.PaymentStatus.VERIFIED);
    await createBaseOrder(3, enums.PaymentStatus.REJECTED);
  });

  afterAll(async () => {
    if (!prisma || createdOrderIds.length === 0) {
      return;
    }

    await prisma.orderAddress.deleteMany({
      where: { orderId: { in: createdOrderIds } },
    });
    await prisma.order.deleteMany({
      where: { id: { in: createdOrderIds } },
    });
  });

  it("filters by payment status", async () => {
    const pending = await listOrders({
      status: undefined,
      paymentStatus: enums.PaymentStatus.PENDING_REVIEW,
      q: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 50,
      format: "json",
    });

    const filtered = pending.orders.filter((order) => order.orderCode.startsWith(baseCode));
    expect(filtered.length).toBe(1);
    expect(filtered[0].paymentStatus).toBe(enums.PaymentStatus.PENDING_REVIEW);
  });

  it("returns KPI snapshot with ALL_TIME and FILTERED scopes", async () => {
    const allTime = await listOrdersWithKpis({
      status: undefined,
      paymentStatus: undefined,
      q: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 50,
      format: "json",
    });

    expect(allTime.kpis.scope).toBe("ALL_TIME");
    expect(allTime.kpis.totalOrders).toBeGreaterThanOrEqual(1);
    expect(allTime.kpis.currency).toBe("MMK");
    expect(allTime.kpis.totalRevenueAmount).toBeGreaterThan(0);
    expect(allTime.kpis.averageOrderValueAmount).toBeGreaterThan(0);
    expect(allTime.kpis.fulfillmentRate).toBeGreaterThanOrEqual(0);

    const filtered = await listOrdersWithKpis({
      status: enums.OrderStatus.PENDING,
      paymentStatus: undefined,
      q: undefined,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 50,
      format: "json",
    });

    expect(filtered.kpis.scope).toBe("FILTERED");
    expect(filtered.kpis.totalOrders).toBeGreaterThanOrEqual(1);
    expect(filtered.kpis.fulfillmentRate).toBeGreaterThanOrEqual(0);
  });

  it("returns zero-safe KPI snapshot for no-match filters", async () => {
    const noMatch = await listOrdersWithKpis({
      status: undefined,
      paymentStatus: undefined,
      q: `${baseCode}-NO-MATCH`,
      from: undefined,
      to: undefined,
      page: 1,
      pageSize: 50,
      format: "json",
    });

    expect(noMatch.kpis.scope).toBe("FILTERED");
    expect(noMatch.kpis.totalOrders).toBe(0);
    expect(noMatch.kpis.totalRevenueAmount).toBe(0);
    expect(noMatch.kpis.averageOrderValueAmount).toBe(0);
    expect(noMatch.kpis.fulfillmentRate).toBe(0);
  });
});

