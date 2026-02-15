import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { LEGAL_TERMS_VERSION } from "@/lib/constants/legal";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true"
    ? process.env.RUN_INTEGRATION_TESTS === "1"
    : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("order workflow integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const guestToken = `it-cart-${suffix}`;
  const adminAuthUserId = crypto.randomUUID();
  const adminEmail = `admin.${suffix}@moethuzar.local`;
  const categorySlug = `it-category-${suffix}`;
  const productSlug = `it-product-${suffix}`;
  const variantSku = `IT-SKU-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let createOrderFromCart: (typeof import("@/server/services/order.service"))["createOrderFromCart"];
  let updateOrderStatus: (typeof import("@/server/services/admin-order.service"))["updateOrderStatus"];
  let AppErrorClass: typeof import("@/server/errors").AppError;
  let enums: typeof import("@prisma/client");

  let adminUserId = "";
  let categoryId = "";
  let productId = "";
  let variantId = "";
  let orderId = "";

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({ createOrderFromCart } = await import("@/server/services/order.service"));
    ({ updateOrderStatus } = await import("@/server/services/admin-order.service"));
    ({ AppError: AppErrorClass } = await import("@/server/errors"));
    enums = await import("@prisma/client");

    const adminUser = await prisma.adminUser.create({
      data: {
        authUserId: adminAuthUserId,
        email: adminEmail,
        fullName: "Integration Admin",
        role: enums.UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    const category = await prisma.category.create({
      data: {
        name: `Integration Category ${suffix}`,
        slug: categorySlug,
      },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: `Integration Product ${suffix}`,
        slug: productSlug,
        description: "Integration test product",
        price: "100.00",
        currency: "MMK",
        status: enums.ProductStatus.ACTIVE,
        categoryId,
        variants: {
          create: {
            sku: variantSku,
            name: "Black / M",
            color: "Black",
            size: "M",
            inventory: 10,
            isActive: true,
            sortOrder: 1,
          },
        },
      },
      include: { variants: true },
    });

    productId = product.id;
    variantId = product.variants[0].id;

    await prisma.cart.create({
      data: {
        guestToken,
        status: enums.CartStatus.ACTIVE,
        currency: "MMK",
        items: {
          create: {
            variantId,
            quantity: 2,
            price: "100.00",
          },
        },
      },
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    if (orderId) {
      await prisma.inventoryLog.deleteMany({ where: { orderId } });
      await prisma.orderStatusHistory.deleteMany({ where: { orderId } });
      await prisma.orderAddress.deleteMany({ where: { orderId } });
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }

    await prisma.cartItem.deleteMany({ where: { cart: { guestToken } } });
    await prisma.cart.deleteMany({ where: { guestToken } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.adminUser.deleteMany({ where: { id: adminUserId } });
  });

  it("creates order from cart and decrements inventory", async () => {
    const idempotencyKey = crypto.randomUUID();
    const order = await createOrderFromCart(
      guestToken,
      {
        country: "Myanmar",
        customerName: "Test Customer",
        customerPhone: "0912345678",
        stateRegion: "Yangon Region",
        townshipCity: "Sanchaung",
        addressLine1: "No. 1, Test Street",
        deliveryFeeAmount: 0,
        customerEmail: "",
        customerNote: "",
        addressLine2: "",
        postalCode: "",
        termsAccepted: true,
        termsVersion: LEGAL_TERMS_VERSION,
      },
      { idempotencyKey }
    );

    const replayed = await createOrderFromCart(
      guestToken,
      {
        country: "Myanmar",
        customerName: "Test Customer",
        customerPhone: "0912345678",
        stateRegion: "Yangon Region",
        townshipCity: "Sanchaung",
        addressLine1: "No. 1, Test Street",
        deliveryFeeAmount: 0,
        customerEmail: "",
        customerNote: "",
        addressLine2: "",
        postalCode: "",
        termsAccepted: true,
        termsVersion: LEGAL_TERMS_VERSION,
      },
      { idempotencyKey }
    );

    expect(replayed.id).toBe(order.id);
    expect(replayed.orderCode).toBe(order.orderCode);

    orderId = order.id;

    expect(order.status).toBe(enums.OrderStatus.PENDING);
    expect(order.orderCode.startsWith("MZT-")).toBe(true);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
    });
    expect(variant.inventory).toBe(8);

    const confirmedLogs = await prisma.inventoryLog.findMany({
      where: {
        orderId,
        variantId,
        changeType: enums.InventoryChangeType.ORDER_CONFIRMED,
      },
    });

    expect(confirmedLogs.length).toBe(1);
    expect(confirmedLogs[0].quantity).toBe(-2);
  });

  it("returns stable stock-conflict error code when inventory is insufficient", async () => {
    const insufficientGuestToken = `it-cart-insufficient-${suffix}`;

    await prisma.cart.create({
      data: {
        guestToken: insufficientGuestToken,
        status: enums.CartStatus.ACTIVE,
        currency: "MMK",
        items: {
          create: {
            variantId,
            quantity: 999,
            price: "100.00",
          },
        },
      },
    });

    await expect(
      createOrderFromCart(insufficientGuestToken, {
        country: "Myanmar",
        customerName: "Stock Conflict",
        customerPhone: "0999999999",
        stateRegion: "Yangon Region",
        townshipCity: "Sanchaung",
        addressLine1: "No. 99, Conflict Street",
        deliveryFeeAmount: 0,
        customerEmail: "",
        customerNote: "",
        addressLine2: "",
        postalCode: "",
        termsAccepted: true,
        termsVersion: LEGAL_TERMS_VERSION,
      })
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
    });

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          guestToken: insufficientGuestToken,
        },
      },
    });
    await prisma.cart.deleteMany({
      where: {
        guestToken: insufficientGuestToken,
      },
    });
  });

  it("restores inventory on cancellation and blocks repeated cancellation", async () => {
    const updated = await updateOrderStatus({
      orderId,
      adminUserId,
      toStatus: enums.OrderStatus.CANCELLED,
      note: "Customer requested cancellation.",
    });

    expect(updated.status).toBe(enums.OrderStatus.CANCELLED);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
    });
    expect(variant.inventory).toBe(10);

    const cancelledLogs = await prisma.inventoryLog.findMany({
      where: {
        orderId,
        variantId,
        changeType: enums.InventoryChangeType.ORDER_CANCELLED,
      },
    });
    expect(cancelledLogs.length).toBe(1);
    expect(cancelledLogs[0].quantity).toBe(2);

    await expect(
      updateOrderStatus({
        orderId,
        adminUserId,
        toStatus: enums.OrderStatus.CANCELLED,
        note: "Duplicate cancel attempt.",
      })
    ).rejects.toBeInstanceOf(AppErrorClass);

    const variantAfterRetry = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variantId },
    });
    expect(variantAfterRetry.inventory).toBe(10);

    const cancelledLogsAfterRetry = await prisma.inventoryLog.findMany({
      where: {
        orderId,
        variantId,
        changeType: enums.InventoryChangeType.ORDER_CANCELLED,
      },
    });
    expect(cancelledLogsAfterRetry.length).toBe(1);
  });
});
