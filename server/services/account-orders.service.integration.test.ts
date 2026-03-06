import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listAccountOrders } from "@/server/services/account-orders.service";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true" ? process.env.RUN_INTEGRATION_TESTS === "1" : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("account orders service integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const customerAAuthId = crypto.randomUUID();
  const customerBAuthId = crypto.randomUUID();
  const customerAEmail = `account-a-${suffix}@example.com`;
  const customerBEmail = `account-b-${suffix}@example.com`;
  const productSlug = `account-orders-product-${suffix}`;
  const categorySlug = `account-orders-category-${suffix}`;

  let prisma: typeof import("@/lib/prisma")["prisma"];
  let customerAId = "";
  let customerBId = "";
  let categoryId = "";
  let productId = "";
  let productVariantId = "";
  const orderIds: string[] = [];

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));

    const customerA = await prisma.customer.create({
      data: { authUserId: customerAAuthId, email: customerAEmail },
    });
    customerAId = customerA.id;

    const customerB = await prisma.customer.create({
      data: { authUserId: customerBAuthId, email: customerBEmail },
    });
    customerBId = customerB.id;

    const category = await prisma.category.create({
      data: {
        name: `Account Orders Category ${suffix}`,
        slug: categorySlug,
      },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: `Account Orders Product ${suffix}`,
        slug: productSlug,
        description: "Account orders test product",
        price: "15000.00",
        currency: "MMK",
        status: "ACTIVE",
        categoryId,
        variants: {
          create: {
            sku: `ACC-ORD-${suffix.toUpperCase()}`,
            name: "Black / M",
            inventory: 100,
            isActive: true,
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    productVariantId = product.variants[0].id;

    const now = Date.now();
    const orderA1 = await prisma.order.create({
      data: {
        orderCode: `MZT-${suffix.toUpperCase()}-A1`,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "NOT_REQUIRED",
        currency: "MMK",
        subtotalAmount: "30000.00",
        totalAmount: "30000.00",
        customerName: "Customer A",
        customerPhone: "0911111111",
        customerId: customerAId,
        createdAt: new Date(now - 1_000),
        items: {
          create: [
            {
              productId,
              variantId: productVariantId,
              productName: product.name,
              productSlug: product.slug,
              variantName: "Black / M",
              sku: `ACC-ORD-${suffix.toUpperCase()}`,
              unitPrice: "10000.00",
              quantity: 2,
              lineTotal: "20000.00",
            },
            {
              productId,
              variantId: productVariantId,
              productName: product.name,
              productSlug: product.slug,
              variantName: "Black / M",
              sku: `ACC-ORD-${suffix.toUpperCase()}`,
              unitPrice: "10000.00",
              quantity: 1,
              lineTotal: "10000.00",
            },
          ],
        },
      },
    });
    orderIds.push(orderA1.id);

    const orderA2 = await prisma.order.create({
      data: {
        orderCode: `MZT-${suffix.toUpperCase()}-A2`,
        status: "DELIVERED",
        paymentMethod: "COD",
        paymentStatus: "NOT_REQUIRED",
        currency: "MMK",
        subtotalAmount: "15000.00",
        totalAmount: "15000.00",
        customerName: "Customer A",
        customerPhone: "0911111111",
        customerId: customerAId,
        createdAt: new Date(now - 2_000),
        items: {
          create: [
            {
              productId,
              variantId: productVariantId,
              productName: product.name,
              productSlug: product.slug,
              variantName: "Black / M",
              sku: `ACC-ORD-${suffix.toUpperCase()}`,
              unitPrice: "15000.00",
              quantity: 1,
              lineTotal: "15000.00",
            },
          ],
        },
      },
    });
    orderIds.push(orderA2.id);

    const orderB = await prisma.order.create({
      data: {
        orderCode: `MZT-${suffix.toUpperCase()}-B1`,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "NOT_REQUIRED",
        currency: "MMK",
        subtotalAmount: "12000.00",
        totalAmount: "12000.00",
        customerName: "Customer B",
        customerPhone: "0922222222",
        customerId: customerBId,
        createdAt: new Date(now - 500),
        items: {
          create: [
            {
              productId,
              variantId: productVariantId,
              productName: product.name,
              productSlug: product.slug,
              variantName: "Black / M",
              sku: `ACC-ORD-${suffix.toUpperCase()}`,
              unitPrice: "12000.00",
              quantity: 1,
              lineTotal: "12000.00",
            },
          ],
        },
      },
    });
    orderIds.push(orderB.id);
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.productVariant.deleteMany({ where: { id: productVariantId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.customer.deleteMany({ where: { id: { in: [customerAId, customerBId] } } });
  });

  it("returns only owned orders with deterministic sorting and item count", async () => {
    const result = await listAccountOrders({
      customerId: customerAId,
      pageSize: 20,
    });

    expect(result.orders.length).toBe(2);
    expect(result.orders[0].orderCode.endsWith("A1")).toBe(true);
    expect(result.orders[1].orderCode.endsWith("A2")).toBe(true);
    expect(result.orders.every((order) => !order.orderCode.endsWith("B1"))).toBe(true);
    expect(result.orders[0].itemCount).toBe(3);
    expect(result.orders[1].itemCount).toBe(1);
  });

  it("enforces cursor pagination and does not leak cross-customer rows", async () => {
    const firstPage = await listAccountOrders({
      customerId: customerAId,
      pageSize: 1,
    });
    expect(firstPage.orders.length).toBe(1);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await listAccountOrders({
      customerId: customerAId,
      pageSize: 1,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(secondPage.orders.length).toBe(1);
    expect(secondPage.orders[0].orderCode).not.toBe(firstPage.orders[0].orderCode);
    expect(secondPage.orders.every((order) => !order.orderCode.endsWith("B1"))).toBe(true);
  });

  it("rejects invalid cursor", async () => {
    await expect(
      listAccountOrders({
        customerId: customerAId,
        pageSize: 1,
        cursor: "not-valid",
      })
    ).rejects.toMatchObject({ code: "INVALID_CURSOR" });
  });
});

