import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const { requireAdminUserMock, updateOrderStatusMock } = vi.hoisted(() => ({
  requireAdminUserMock: vi.fn(),
  updateOrderStatusMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUserId: requireAdminUserMock,
}));

vi.mock("@/server/services/admin-order.service", () => ({
  updateOrderStatus: updateOrderStatusMock,
}));

import { PATCH as updateStatusPatch } from "@/app/api/admin/orders/[orderId]/status/route";

describe("admin order status route", () => {
  const orderId = "11111111-1111-1111-8111-111111111111";

  beforeEach(() => {
    requireAdminUserMock.mockReset();
    updateOrderStatusMock.mockReset();
  });

  it("returns conflict code for invalid status transition", async () => {
    requireAdminUserMock.mockResolvedValueOnce("admin-user-id");
    updateOrderStatusMock.mockRejectedValueOnce(
      new AppError(
        "Invalid status transition: DELIVERED -> CONFIRMED.",
        409,
        "INVALID_ORDER_STATUS_TRANSITION"
      )
    );

    const response = await updateStatusPatch(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("INVALID_ORDER_STATUS_TRANSITION");
  });

  it("returns forbidden shape when admin is not allowed", async () => {
    requireAdminUserMock.mockRejectedValueOnce(new AppError("Forbidden.", 403, "FORBIDDEN"));

    const response = await updateStatusPatch(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("FORBIDDEN");
  });
});
