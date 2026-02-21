import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const { requireAdminUserMock, reviewOrderPaymentMock } = vi.hoisted(() => ({
  requireAdminUserMock: vi.fn(),
  reviewOrderPaymentMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUserId: requireAdminUserMock,
}));

vi.mock("@/server/services/admin-order.service", () => ({
  reviewOrderPayment: reviewOrderPaymentMock,
}));

import { PATCH as reviewPaymentPatch } from "@/app/api/admin/orders/[orderId]/payment/route";

describe("admin order payment review route", () => {
  const orderId = "11111111-1111-1111-8111-111111111111";

  beforeEach(() => {
    requireAdminUserMock.mockReset();
    reviewOrderPaymentMock.mockReset();
  });

  it("returns unauthorized shape when admin auth fails", async () => {
    requireAdminUserMock.mockRejectedValueOnce(
      new AppError("Invalid access token.", 401, "UNAUTHORIZED")
    );

    const response = await reviewPaymentPatch(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "VERIFIED" }),
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("UNAUTHORIZED");
    expect(payload.requestId).toBeTruthy();
  });

  it("returns forbidden shape when admin is not allowed", async () => {
    requireAdminUserMock.mockRejectedValueOnce(
      new AppError("Forbidden.", 403, "FORBIDDEN")
    );

    const response = await reviewPaymentPatch(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "REJECTED" }),
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("FORBIDDEN");
    expect(payload.requestId).toBeTruthy();
  });

  it("reviews payment successfully", async () => {
    requireAdminUserMock.mockResolvedValueOnce("admin-user-id");
    reviewOrderPaymentMock.mockResolvedValueOnce({
      id: "order-id",
      orderCode: "MZT-20260221-000001AAAAAA",
      paymentStatus: "VERIFIED",
    });

    const response = await reviewPaymentPatch(
      new Request(`http://localhost:3000/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "VERIFIED", note: "Looks good" }),
      }),
      { params: Promise.resolve({ orderId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(reviewOrderPaymentMock).toHaveBeenCalledWith({
      orderId,
      adminUserId: "admin-user-id",
      decision: "VERIFIED",
      note: "Looks good",
    });
  });
});
