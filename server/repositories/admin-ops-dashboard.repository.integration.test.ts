import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OrderStatus, PaymentMethod, PaymentStatus, ProductStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { prismaAdminOpsDashboardRepository } from "@/server/repositories/admin-ops-dashboard.repository";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true" ? process.env.RUN_INTEGRATION_TESTS === "1" : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("admin ops dashboard repository integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const baseCode = `MZT-IT-OPS-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let categoryId = "";
  let productAId = "";
  let productBId = "";
  const createdOrderIds: string[] = [];

  const range = {
    start: new Date("2099-02-20T00:00:00.000Z"),
    end: new Date("2099-02-26T23:59:59.999Z"),
  };

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));

    const category = await prisma.category.create({
      data: {
        name: `Ops Repo Category ${suffix}`,
        slug: `ops-repo-category-${suffix}`,
      },
    });
    categoryId = category.id;

    const productA = await prisma.product.create({
      data: {
        name: `Ops Product A ${suffix}`,
        slug: `ops-product-a-${suffix}`,
        description: "Integration product A",
        price: "5000",
        currency: "MMK",
        status: ProductStatus.ACTIVE,
        categoryId,
      },
    });
    productAId = productA.id;

    const productB = await prisma.product.create({
      data: {
        name: `Ops Product B ${suffix}`,
        slug: `ops-product-b-${suffix}`,
        description: "Integration product B",
        price: "20000",
        currency: "MMK",
        status: ProductStatus.ACTIVE,
        categoryId,
      },
    });
    productBId = productB.id;

    await prisma.productImage.createMany({
      data: [
        {
          productId: productAId,
          url: `https://example.com/${suffix}-a.jpg`,
          alt: "A",
          sortOrder: 0,
        },
        {
          productId: productBId,
          url: `https://example.com/${suffix}-b.jpg`,
          alt: "B",
          sortOrder: 0,
        },
      ],
    });

    const createOrder = async (params: {
      codeSuffix: string;
      createdAt: string;
      status: OrderStatus;
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
      totalAmount: string;
      items: Array<{
        productId: string;
        productName: string;
        productSlug: string;
        unitPrice: string;
        quantity: number;
        lineTotal: string;
      }>;
    }) => {
      const order = await prisma.order.create({
        data: {
          orderCode: `${baseCode}-${params.codeSuffix}`,
          status: params.status,
          paymentMethod: params.paymentMethod,
          paymentStatus: params.paymentStatus,
          currency: "MMK",
          subtotalAmount: params.totalAmount,
          deliveryFeeAmount: "0",
          totalAmount: params.totalAmount,
          customerName: `Ops ${params.codeSuffix}`,
          customerPhone: `091234${params.codeSuffix.padStart(6, "0").slice(-6)}`,
          createdAt: new Date(params.createdAt),
          items: {
            create: params.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSlug: item.productSlug,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      createdOrderIds.push(order.id);
    };

    // Eligible: COD + non-cancelled
    await createOrder({
      codeSuffix: "001",
      createdAt: "2099-02-20T08:00:00.000Z",
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      totalAmount: "10000",
      items: [
        {
          productId: productAId,
          productName: `Ops Product A ${suffix}`,
          productSlug: `ops-product-a-${suffix}`,
          unitPrice: "5000",
          quantity: 2,
          lineTotal: "10000",
        },
      ],
    });

    // Eligible: prepaid verified
    await createOrder({
      codeSuffix: "002",
      createdAt: "2099-02-21T08:00:00.000Z",
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.VERIFIED,
      totalAmount: "20000",
      items: [
        {
          productId: productBId,
          productName: `Ops Product B ${suffix}`,
          productSlug: `ops-product-b-${suffix}`,
          unitPrice: "20000",
          quantity: 1,
          lineTotal: "20000",
        },
      ],
    });

    // Eligible: COD confirmed
    await createOrder({
      codeSuffix: "003",
      createdAt: "2099-02-21T10:00:00.000Z",
      status: OrderStatus.CONFIRMED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      totalAmount: "5000",
      items: [
        {
          productId: productAId,
          productName: `Ops Product A ${suffix}`,
          productSlug: `ops-product-a-${suffix}`,
          unitPrice: "5000",
          quantity: 1,
          lineTotal: "5000",
        },
      ],
    });

    // Excluded: prepaid not verified
    await createOrder({
      codeSuffix: "004",
      createdAt: "2099-02-22T08:00:00.000Z",
      status: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.PENDING_REVIEW,
      totalAmount: "9000",
      items: [
        {
          productId: productBId,
          productName: `Ops Product B ${suffix}`,
          productSlug: `ops-product-b-${suffix}`,
          unitPrice: "9000",
          quantity: 1,
          lineTotal: "9000",
        },
      ],
    });

    // Excluded: cancelled
    await createOrder({
      codeSuffix: "005",
      createdAt: "2099-02-23T08:00:00.000Z",
      status: OrderStatus.CANCELLED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      totalAmount: "7000",
      items: [
        {
          productId: productAId,
          productName: `Ops Product A ${suffix}`,
          productSlug: `ops-product-a-${suffix}`,
          unitPrice: "7000",
          quantity: 1,
          lineTotal: "7000",
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (createdOrderIds.length > 0) {
      await prisma.order.deleteMany({
        where: {
          id: {
            in: createdOrderIds,
          },
        },
      });
    }

    if (productAId || productBId) {
      await prisma.productImage.deleteMany({
        where: {
          productId: {
            in: [productAId, productBId].filter(Boolean),
          },
        },
      });
      await prisma.product.deleteMany({
        where: {
          id: {
            in: [productAId, productBId].filter(Boolean),
          },
        },
      });
    }

    if (categoryId) {
      await prisma.category.deleteMany({
        where: { id: categoryId },
      });
    }
  });

  it("returns seven-day sales series with excluded payment/order states filtered out", async () => {
    const series = await prismaAdminOpsDashboardRepository.getSalesOverviewSeries({
      range,
      timezone: "Asia/Yangon",
    });

    expect(series).toHaveLength(7);
    const totals = series.reduce(
      (acc, row) => ({
        sales: acc.sales + Number(row.salesAmount),
        orders: acc.orders + row.ordersCount,
      }),
      { sales: 0, orders: 0 },
    );

    // eligible totals: 10000 + 20000 + 5000 = 35000, order count = 3
    expect(totals.sales).toBe(35000);
    expect(totals.orders).toBe(3);
  });

  it("returns top products ranked by units sold then sales amount", async () => {
    const topProducts = await prismaAdminOpsDashboardRepository.listTopProducts({
      range,
      limit: 5,
    });

    expect(topProducts.length).toBeGreaterThanOrEqual(2);
    expect(topProducts[0]).toMatchObject({
      productId: productAId,
      unitsSold: 3,
      salesAmount: expect.anything(),
    });
    expect(topProducts[0].thumbnailUrl).toContain(`${suffix}-a.jpg`);
    expect(topProducts[1]).toMatchObject({
      productId: productBId,
      unitsSold: 1,
    });
  });

  it("returns recent financially eligible orders sorted newest-first", async () => {
    const recent = await prismaAdminOpsDashboardRepository.listRecentOrders({
      limit: 10,
    });

    const scoped = recent.filter((row) => row.orderCode.startsWith(baseCode));
    expect(scoped).toHaveLength(3);
    expect(scoped[0].orderCode).toBe(`${baseCode}-003`);
    expect(scoped[1].orderCode).toBe(`${baseCode}-002`);
    expect(scoped[2].orderCode).toBe(`${baseCode}-001`);
  });
});
