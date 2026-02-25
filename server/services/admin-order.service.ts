import { prisma } from "@/lib/prisma";
import type { AdminOrdersListQueryInput } from "@/lib/validation/admin-order";
import {
  buildAdminOrdersWhere,
  prismaAdminOrdersListRepository,
} from "@/server/repositories/admin-orders-list.repository";
import { buildOrderActionContract } from "@/server/domain/admin-order-action-contract";
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

type AdminOrderDetail = Prisma.OrderGetPayload<{
  include: {
    address: true;
    items: true;
    history: {
      orderBy: { createdAt: "asc" };
    };
  };
}> & {
  actionState: ReturnType<typeof buildOrderActionContract>;
};

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listOrders(query: AdminOrdersListQueryInput) {
  const where = buildAdminOrdersWhere(query);

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
  const where = buildAdminOrdersWhere(query);

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      address: true,
    },
  });
}

export async function getOrdersKpiAggregates(query: Omit<AdminOrdersListQueryInput, "page" | "pageSize" | "format">) {
  const where = buildAdminOrdersWhere(query);
  return prismaAdminOrdersListRepository.getOrdersKpiAggregates(where);
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

  const actionState = buildOrderActionContract({
    orderStatus: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    hasPaymentProof: Boolean(order.paymentProofUrl),
  });

  return {
    ...order,
    actionState,
  } satisfies AdminOrderDetail;
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
      throw new AppError(
        "Order is not a prepaid transfer order.",
        409,
        "PAYMENT_REVIEW_NOT_APPLICABLE"
      );
    }

    if (!order.paymentProofUrl) {
      throw new AppError("Payment proof is missing.", 409, "PAYMENT_PROOF_MISSING");
    }

    assertPaymentReviewTransition(order.paymentStatus, input.decision);

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
