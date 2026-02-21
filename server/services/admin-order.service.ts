import { prisma } from "@/lib/prisma";
import type { AdminOrdersListQueryInput } from "@/lib/validation/admin-order";
import {
  assertOrderStatusTransition,
  buildOrderTimestampPatch,
  requiresInventoryRestore,
} from "@/server/domain/order-status";
import { AppError } from "@/server/errors";
import {
  InventoryChangeType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseStartDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseEndDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(23, 59, 59, 999);
  return date;
}

export async function listOrders(query: AdminOrdersListQueryInput) {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  const search = query.q?.trim();
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const createdAt: Prisma.DateTimeFilter = {};
  const fromDate = parseStartDate(query.from);
  if (fromDate) {
    createdAt.gte = fromDate;
  }

  const toDate = parseEndDate(query.to);
  if (toDate) {
    createdAt.lte = toDate;
  }
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        address: true,
        items: true,
      },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function listOrdersForCsv(query: Omit<AdminOrdersListQueryInput, "page" | "pageSize">) {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  const search = query.q?.trim();
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
    ];
  }

  const createdAt: Prisma.DateTimeFilter = {};
  const fromDate = parseStartDate(query.from);
  if (fromDate) {
    createdAt.gte = fromDate;
  }

  const toDate = parseEndDate(query.to);
  if (toDate) {
    createdAt.lte = toDate;
  }
  if (createdAt.gte || createdAt.lte) {
    where.createdAt = createdAt;
  }

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      address: true,
    },
  });
}

export async function getOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      address: true,
      items: true,
      history: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
  }

  return order;
}

export async function updateOrderStatus(input: {
  orderId: string;
  adminUserId: string;
  toStatus: OrderStatus;
  note?: string;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    assertOrderStatusTransition(order.status, input.toStatus);

    const timestampPatch = buildOrderTimestampPatch(order.status, input.toStatus, now);

    const updated = await tx.order.update({
      where: { id: input.orderId },
      data: {
        status: input.toStatus,
        confirmedByAdminId:
          input.toStatus === OrderStatus.CONFIRMED
            ? input.adminUserId
            : order.confirmedByAdminId,
        ...timestampPatch,
      },
      include: {
        address: true,
        items: true,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: input.toStatus,
        note: normalizeOptionalText(input.note),
        changedByAdminId: input.adminUserId,
      },
    });

    if (requiresInventoryRestore(order.status, input.toStatus)) {
      for (const item of order.items) {
        if (!item.variantId || !item.productId) {
          continue;
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            inventory: {
              increment: item.quantity,
            },
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            orderId: input.orderId,
            changeType: InventoryChangeType.ORDER_CANCELLED,
            quantity: item.quantity,
            note: "Stock restored after order cancellation.",
          },
        });
      }
    }

    return updated;
  });
}

function assertPaymentReviewTransition(currentStatus: PaymentStatus, nextStatus: PaymentStatus) {
  if (currentStatus !== PaymentStatus.PENDING_REVIEW) {
    throw new AppError("Payment is not pending review.", 409, "PAYMENT_REVIEW_NOT_PENDING");
  }

  if (nextStatus !== PaymentStatus.VERIFIED && nextStatus !== PaymentStatus.REJECTED) {
    throw new AppError("Invalid payment review transition.", 400, "INVALID_PAYMENT_REVIEW");
  }
}

export async function reviewOrderPayment(input: {
  orderId: string;
  adminUserId: string;
  decision: Extract<PaymentStatus, "VERIFIED" | "REJECTED">;
  note?: string;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (order.paymentMethod !== PaymentMethod.PREPAID_TRANSFER) {
      throw new AppError("Order is not a prepaid transfer order.", 409, "PAYMENT_REVIEW_NOT_APPLICABLE");
    }

    assertPaymentReviewTransition(order.paymentStatus, input.decision);

    if (!order.paymentProofUrl) {
      throw new AppError("Payment proof is missing.", 409, "PAYMENT_PROOF_MISSING");
    }

    const updated = await tx.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: input.decision,
        paymentVerifiedAt: input.decision === PaymentStatus.VERIFIED ? now : null,
      },
      include: {
        address: true,
        items: true,
      },
    });

    const decisionLabel = input.decision === PaymentStatus.VERIFIED ? "verified" : "rejected";
    const baseNote = `Prepaid payment ${decisionLabel} by admin.`;
    const extraNote = normalizeOptionalText(input.note);
    const historyNote = extraNote ? `${baseNote} ${extraNote}` : baseNote;

    await tx.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        fromStatus: order.status,
        toStatus: order.status,
        note: historyNote,
        changedByAdminId: input.adminUserId,
      },
    });

    return updated;
  });
}
