import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const { requireAdminUserMock, reviewOrderPaymentMock, emitPaymentReviewHookMock } = vi.hoisted(() => ({
  requireAdminUserMock: vi.fn(),
  reviewOrderPaymentMock: vi.fn(),
  emitPaymentReviewHookMock: vi.fn(),
}));

vi.mock("@/server/auth/admin", () => ({
  requireAdminUserId: requireAdminUserMock,
}));

vi.mock("@/server/services/admin-order.service", () => ({
  reviewOrderPayment: reviewOrderPaymentMock,
}));

vi.mock("@/server/services/payment-notification.service", () => ({
  emitPaymentReviewHook: emitPaymentReviewHookMock,
}));

import { PATCH as reviewPaymentPatch } from "@/app/api/admin/orders/[orderId]/payment/route";

describe("admin order payment review route", () => {
  const orderId = "11111111-1111-1111-8111-111111111111";

  beforeEach(() => {
    requireAdminUserMock.mockReset();
    reviewOrderPaymentMock.mockReset();
    emitPaymentReviewHookMock.mockReset();
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
  });

  it("reviews payment successfully and emits hook", async () => {
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
    expect(emitPaymentReviewHookMock).toHaveBeenCalledWith({
      orderId: "order-id",
      orderCode: "MZT-20260221-000001AAAAAA",
      outcome: "VERIFIED",
      adminUserId: "admin-user-id",
    });
  });

  it("returns conflict code for payment review that is no longer pending", async () => {
    requireAdminUserMock.mockResolvedValueOnce("admin-user-id");
    reviewOrderPaymentMock.mockRejectedValueOnce(
      new AppError("Payment is not pending review.", 409, "PAYMENT_REVIEW_NOT_PENDING")
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

    expect(response.status).toBe(409);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("PAYMENT_REVIEW_NOT_PENDING");
    expect(emitPaymentReviewHookMock).not.toHaveBeenCalled();
  });
});

