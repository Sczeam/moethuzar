import { describe, expect, it } from "vitest";
import { buildOrderActionRequest } from "@/app/admin/orders/[orderId]/order-action-adapter";

describe("admin order action request adapter", () => {
  it("maps payment verify action to payment endpoint", () => {
    const request = buildOrderActionRequest("order-1", "payment.verify", "  note  ");
    expect(request).toEqual({
      endpoint: "/api/admin/orders/order-1/payment",
      body: {
        decision: "VERIFIED",
        note: "note",
      },
    });
  });

  it("maps status cancel action to status endpoint", () => {
    const request = buildOrderActionRequest("order-1", "status.cancel", "cancel reason");
    expect(request).toEqual({
      endpoint: "/api/admin/orders/order-1/status",
      body: {
        toStatus: "CANCELLED",
        note: "cancel reason",
      },
    });
  });
});
