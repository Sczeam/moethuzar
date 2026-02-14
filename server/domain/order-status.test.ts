import {
  assertOrderStatusTransition,
  buildOrderTimestampPatch,
  canTransitionOrderStatus,
  requiresInventoryRestore,
} from "@/server/domain/order-status";
import { AppError } from "@/server/errors";
import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

describe("canTransitionOrderStatus", () => {
  it("allows valid transitions", () => {
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.CONFIRMED, OrderStatus.DELIVERING)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.DELIVERING, OrderStatus.DELIVERED)).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.PENDING)).toBe(false);
  });
});

describe("assertOrderStatusTransition", () => {
  it("throws AppError on invalid transitions", () => {
    expect(() =>
      assertOrderStatusTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)
    ).toThrowError(AppError);
  });
});

describe("requiresInventoryRestore", () => {
  it("restores inventory for cancellable active states", () => {
    expect(requiresInventoryRestore(OrderStatus.PENDING, OrderStatus.CANCELLED)).toBe(true);
    expect(requiresInventoryRestore(OrderStatus.CONFIRMED, OrderStatus.CANCELLED)).toBe(true);
    expect(requiresInventoryRestore(OrderStatus.DELIVERING, OrderStatus.CANCELLED)).toBe(true);
  });

  it("does not restore for non-cancel transitions", () => {
    expect(requiresInventoryRestore(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(false);
    expect(requiresInventoryRestore(OrderStatus.CONFIRMED, OrderStatus.DELIVERING)).toBe(false);
  });
});

describe("buildOrderTimestampPatch", () => {
  const now = new Date("2026-02-13T12:00:00.000Z");

  it("sets confirmed timestamp on confirm", () => {
    const patch = buildOrderTimestampPatch(OrderStatus.PENDING, OrderStatus.CONFIRMED, now);
    expect(patch.confirmedAt).toEqual(now);
    expect(patch.cancelledAt).toBeUndefined();
    expect(patch.deliveredAt).toBeUndefined();
  });

  it("sets delivered timestamp on delivered", () => {
    const patch = buildOrderTimestampPatch(OrderStatus.DELIVERING, OrderStatus.DELIVERED, now);
    expect(patch.deliveredAt).toEqual(now);
  });

  it("sets cancelled timestamp on cancel", () => {
    const patch = buildOrderTimestampPatch(OrderStatus.PENDING, OrderStatus.CANCELLED, now);
    expect(patch.cancelledAt).toEqual(now);
  });
});
