import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";

const {
  rateLimitOrResponseMock,
  resolveCartSessionMock,
  previewPromoForActiveCartMock,
} = vi.hoisted(() => ({
  rateLimitOrResponseMock: vi.fn(),
  resolveCartSessionMock: vi.fn(),
  previewPromoForActiveCartMock: vi.fn(),
}));

vi.mock("@/server/security/rate-limit", () => ({
  rateLimitOrResponse: rateLimitOrResponseMock,
}));

vi.mock("@/lib/cart-session", () => ({
  resolveCartSession: resolveCartSessionMock,
}));

vi.mock("@/server/services/checkout-promo.service", () => ({
  previewPromoForActiveCart: previewPromoForActiveCartMock,
}));

import { POST as checkoutPromoPost } from "@/app/api/checkout/promo/route";

describe("checkout promo route", () => {
  beforeEach(() => {
    rateLimitOrResponseMock.mockReset();
    resolveCartSessionMock.mockReset();
    previewPromoForActiveCartMock.mockReset();
  });

  it("returns promo preview on success", async () => {
    rateLimitOrResponseMock.mockReturnValueOnce(null);
    resolveCartSessionMock.mockReturnValueOnce({ token: "guest-token" });
    previewPromoForActiveCartMock.mockResolvedValueOnce({
      promoCode: "SAVE10",
      discountType: "PERCENT",
      discountValue: 10,
      discountAmount: 5000,
      subtotalBeforeDiscount: 50000,
      subtotalAfterDiscount: 45000,
    });

    const response = await checkoutPromoPost(
      new Request("http://localhost:3000/api/checkout/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: "save10" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.promo).toMatchObject({
      promoCode: "SAVE10",
      discountAmount: 5000,
      subtotalAfterDiscount: 45000,
    });
    expect(previewPromoForActiveCartMock).toHaveBeenCalledWith("guest-token", {
      promoCode: "save10",
    });
  });

  it("returns rate-limit response without calling preview service", async () => {
    rateLimitOrResponseMock.mockReturnValueOnce(
      new Response(JSON.stringify({ ok: false, code: "RATE_LIMITED" }), { status: 429 }),
    );

    const response = await checkoutPromoPost(
      new Request("http://localhost:3000/api/checkout/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: "save10" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.code).toBe("RATE_LIMITED");
    expect(previewPromoForActiveCartMock).not.toHaveBeenCalled();
  });

  it("returns deterministic app error envelope for invalid promo", async () => {
    rateLimitOrResponseMock.mockReturnValueOnce(null);
    resolveCartSessionMock.mockReturnValueOnce({ token: "guest-token" });
    previewPromoForActiveCartMock.mockRejectedValueOnce(
      new AppError("Promo SAVE10 is invalid.", 400, "PROMO_INVALID_CODE"),
    );

    const response = await checkoutPromoPost(
      new Request("http://localhost:3000/api/checkout/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: "save10" }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("PROMO_INVALID_CODE");
    expect(payload.requestId).toBeTruthy();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});

