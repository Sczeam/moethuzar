import { AppError } from "@/server/errors";
import { OrderStatus } from "@prisma/client";

const TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransitionOrderStatus(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }

  return TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertOrderStatusTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): void {
  if (!canTransitionOrderStatus(fromStatus, toStatus)) {
    throw new AppError(
      `Invalid status transition: ${fromStatus} -> ${toStatus}.`,
      409,
      "INVALID_ORDER_STATUS_TRANSITION"
    );
  }
}

export function requiresInventoryRestore(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  return (
    toStatus === OrderStatus.CANCELLED &&
    (fromStatus === OrderStatus.PENDING ||
      fromStatus === OrderStatus.CONFIRMED ||
      fromStatus === OrderStatus.DELIVERING)
  );
}

export function buildOrderTimestampPatch(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  now: Date
): {
  confirmedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
} {
  const patch: {
    confirmedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
  } = {};

  if (fromStatus !== OrderStatus.CONFIRMED && toStatus === OrderStatus.CONFIRMED) {
    patch.confirmedAt = now;
  }

  if (fromStatus !== OrderStatus.DELIVERED && toStatus === OrderStatus.DELIVERED) {
    patch.deliveredAt = now;
  }

  if (toStatus === OrderStatus.CANCELLED) {
    patch.cancelledAt = now;
  }

  return patch;
}
