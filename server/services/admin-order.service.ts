import { prisma } from "@/lib/prisma";
import {
  assertOrderStatusTransition,
  buildOrderTimestampPatch,
  requiresInventoryRestore,
} from "@/server/domain/order-status";
import { AppError } from "@/server/errors";
import { InventoryChangeType, OrderStatus } from "@prisma/client";

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      address: true,
      items: true,
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
