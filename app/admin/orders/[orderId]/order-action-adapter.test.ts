import { describe, expect, it } from "vitest";
import { buildOrderActionRequest, INVALID_TRANSITION_CODES } from "./order-action-adapter";

describe("order-action-adapter", () => {
  it("maps payment verify action to payment endpoint payload", () => {
    const request = buildOrderActionRequest("order-1", "payment.verify", "  note  ");
    expect(request).toEqual({
      endpoint: "/api/admin/orders/order-1/payment",
      body: {
        decision: "VERIFIED",
        note: "note",
      },
    });
  });

  it("maps status cancel action to status endpoint payload", () => {
    const request = buildOrderActionRequest("order-1", "status.cancel", "cancel reason");
    expect(request).toEqual({
      endpoint: "/api/admin/orders/order-1/status",
      body: {
        toStatus: "CANCELLED",
        note: "cancel reason",
      },
    });
  });

  it("contains key invalid transition guardrail codes", () => {
    expect(INVALID_TRANSITION_CODES.has("INVALID_ORDER_STATUS_TRANSITION")).toBe(true);
    expect(INVALID_TRANSITION_CODES.has("PAYMENT_REVIEW_NOT_PENDING")).toBe(true);
  });
});
