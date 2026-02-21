import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const shouldRunIntegrationTests =
  process.env.CI === "true" ? process.env.RUN_INTEGRATION_TESTS === "1" : true;

const canRunIntegration = hasDatabase && shouldRunIntegrationTests;
const describeIfDatabase = canRunIntegration ? describe : describe.skip;

describeIfDatabase("admin order payment review integration", () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const adminAuthUserId = crypto.randomUUID();
  const adminEmail = `payment-review-${suffix}@example.com`;
  const orderCodeBase = `MZT-IT-PAY-${suffix.toUpperCase()}`;

  let prisma: PrismaClient;
  let reviewOrderPayment: (typeof import("@/server/services/admin-order.service"))["reviewOrderPayment"];
  let AppErrorClass: typeof import("@/server/errors")["AppError"];
  let enums: typeof import("@prisma/client");

  let adminUserId = "";
  let verifiedOrderId = "";
  let rejectedOrderId = "";

  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    ({ reviewOrderPayment } = await import("@/server/services/admin-order.service"));
    ({ AppError: AppErrorClass } = await import("@/server/errors"));
    enums = await import("@prisma/client");

    const adminUser = await prisma.adminUser.create({
      data: {
        authUserId: adminAuthUserId,
        email: adminEmail,
        role: enums.UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    const baseOrderData = {
      status: enums.OrderStatus.PENDING,
      paymentMethod: enums.PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: enums.PaymentStatus.PENDING_REVIEW,
      paymentProofUrl: `https://example.com/payment-proof-${suffix}.jpg`,
      paymentReference: `KBZPAY:TEST${suffix}`,
      paymentSubmittedAt: new Date(),
      currency: "MMK",
      subtotalAmount: "10000",
      deliveryFeeAmount: "1500",
      totalAmount: "11500",
      customerName: "Payment Test",
      customerPhone: "09111111111",
      address: {
        create: {
          country: "Myanmar",
          stateRegion: "Yangon Region",
          townshipCity: "Yangon (Other)",
          addressLine1: "No. 1, Test Street",
        },
      },
    } satisfies Omit<Parameters<typeof prisma.order.create>[0]["data"], "orderCode">;

    const verifiedOrder = await prisma.order.create({
      data: {
        ...baseOrderData,
        orderCode: `${orderCodeBase}-A`,
      },
    });
    verifiedOrderId = verifiedOrder.id;

    const rejectedOrder = await prisma.order.create({
      data: {
        ...baseOrderData,
        orderCode: `${orderCodeBase}-B`,
      },
    });
    rejectedOrderId = rejectedOrder.id;
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    await prisma.orderStatusHistory.deleteMany({
      where: {
        orderId: { in: [verifiedOrderId, rejectedOrderId].filter(Boolean) },
      },
    });
    await prisma.orderAddress.deleteMany({
      where: {
        orderId: { in: [verifiedOrderId, rejectedOrderId].filter(Boolean) },
      },
    });
    await prisma.order.deleteMany({
      where: { id: { in: [verifiedOrderId, rejectedOrderId].filter(Boolean) } },
    });
    if (adminUserId) {
      await prisma.adminUser.deleteMany({ where: { id: adminUserId } });
    }
  });

  it("verifies prepaid payment and records audit history", async () => {
    const updated = await reviewOrderPayment({
      orderId: verifiedOrderId,
      adminUserId,
      decision: enums.PaymentStatus.VERIFIED,
      note: "Bank screenshot matched.",
    });

    expect(updated.paymentStatus).toBe(enums.PaymentStatus.VERIFIED);
    expect(updated.paymentVerifiedAt).toBeTruthy();

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: verifiedOrderId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    expect(history).toHaveLength(1);
    expect(history[0].note).toContain("Prepaid payment verified by admin.");
    expect(history[0].note).toContain("Bank screenshot matched.");
    expect(history[0].changedByAdminId).toBe(adminUserId);
  });

  it("rejects prepaid payment and blocks repeated review", async () => {
    const updated = await reviewOrderPayment({
      orderId: rejectedOrderId,
      adminUserId,
      decision: enums.PaymentStatus.REJECTED,
      note: "Reference does not match amount.",
    });

    expect(updated.paymentStatus).toBe(enums.PaymentStatus.REJECTED);
    expect(updated.paymentVerifiedAt).toBeNull();

    await expect(
      reviewOrderPayment({
        orderId: rejectedOrderId,
        adminUserId,
        decision: enums.PaymentStatus.VERIFIED,
      })
    ).rejects.toMatchObject({
      name: AppErrorClass.name,
      code: "PAYMENT_REVIEW_NOT_PENDING",
      status: 409,
    });
  });
});

