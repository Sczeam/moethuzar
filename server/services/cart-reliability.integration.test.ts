import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true"
    ? process.env.RUN_INTEGRATION_TESTS === "1"
    : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("cart reliability integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const guestToken = `it-reliability-cart-${suffix}`;
  const categorySlug = `it-reliability-category-${suffix}`;
  const productSlug = `it-reliability-product-${suffix}`;
  const variantSku = `IT-REL-SKU-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let addCartItem: (typeof import("@/server/services/cart.service"))["addCartItem"];
  let checkoutPost: (typeof import("@/app/api/checkout/route"))["POST"];
  let enums: typeof import("@prisma/client");

  let categoryId = "";
  let productId = "";
  let variantId = "";
  let cartId = "";
  let orderId = "";

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({ addCartItem } = await import("@/server/services/cart.service"));
    ({ POST: checkoutPost } = await import("@/app/api/checkout/route"));
    enums = await import("@prisma/client");

    const category = await prisma.category.create({
      data: {
        name: `Reliability Category ${suffix}`,
        slug: categorySlug,
      },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: `Reliability Product ${suffix}`,
        slug: productSlug,
        description: "Reliability integration product",
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

    if (cartId) {
      await prisma.cartItem.deleteMany({ where: { cartId } });
      await prisma.cart.deleteMany({ where: { id: cartId } });
    } else {
      await prisma.cartItem.deleteMany({ where: { cart: { guestToken } } });
      await prisma.cart.deleteMany({ where: { guestToken } });
    }

    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
  });

  it("reactivates converted cart token and clears stale items before adding", async () => {
    const cart = await prisma.cart.create({
      data: {
        guestToken,
        status: enums.CartStatus.CONVERTED,
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
    cartId = cart.id;

    const updated = await addCartItem(guestToken, { variantId, quantity: 1 });

    expect(updated.status).toBe(enums.CartStatus.ACTIVE);
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(1);
  });

  it("rotates cart cookie after successful checkout", async () => {
    const idempotencyKey = crypto.randomUUID();
    const request = new Request("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-idempotency-key": idempotencyKey,
        cookie: `cart_token=${guestToken}`,
      },
      body: JSON.stringify({
        country: "Myanmar",
        customerName: "Reliability Checkout",
        customerPhone: "0912345678",
        stateRegion: "Yangon Region",
        townshipCity: "Sanchaung",
        addressLine1: "No. 1, Reliability Street",
        deliveryFeeAmount: 0,
        customerEmail: "",
        customerNote: "",
        addressLine2: "",
        postalCode: "",
      }),
    });

    const response = await checkoutPost(request);
    const payload = await response.json();
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(201);
    expect(payload.ok).toBe(true);
    expect(setCookie).toContain("cart_token=");
    expect(setCookie).not.toContain(`cart_token=${guestToken}`);

    orderId = payload.order.id;
  });
});
