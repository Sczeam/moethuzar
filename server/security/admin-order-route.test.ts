import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const { requireAdminUserMock, getOrderByIdMock } = vi.hoisted(() => ({
  requireAdminUserMock: vi.fn(),
  getOrderByIdMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUserId: requireAdminUserMock,
}));

vi.mock("@/server/services/admin-order.service", () => ({
  getOrderById: getOrderByIdMock,
}));

import { GET as orderDetailGet } from "@/app/api/admin/orders/[orderId]/route";

describe("admin order detail route", () => {
  const orderId = "11111111-1111-1111-8111-111111111111";

  beforeEach(() => {
    requireAdminUserMock.mockReset();
    getOrderByIdMock.mockReset();
  });

  it("returns unauthorized shape when admin auth fails", async () => {
    requireAdminUserMock.mockRejectedValueOnce(
      new AppError("Invalid access token.", 401, "UNAUTHORIZED")
    );

    const response = await orderDetailGet(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}`, {
        method: "GET",
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("UNAUTHORIZED");
  });

  it("returns order detail with action state", async () => {
    requireAdminUserMock.mockResolvedValueOnce("admin-user-id");
    getOrderByIdMock.mockResolvedValueOnce({
      id: "order-id",
      orderCode: "MZT-20260225-000001AAAAAA",
      status: "PENDING",
      paymentStatus: "PENDING_REVIEW",
      actionState: {
        allowedActions: ["payment.verify", "payment.reject", "status.confirm", "status.cancel"],
        recommendedAction: "payment.verify",
        blockedActions: [],
      },
    });

    const response = await orderDetailGet(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}`, {
        method: "GET",
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.order.actionState).toEqual({
      allowedActions: ["payment.verify", "payment.reject", "status.confirm", "status.cancel"],
      recommendedAction: "payment.verify",
      blockedActions: [],
    });
  });
});
