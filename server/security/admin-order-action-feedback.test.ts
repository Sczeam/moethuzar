import { describe, expect, it } from "vitest";
import { mapOrderActionError } from "@/app/admin/orders/[orderId]/action-feedback";

describe("admin order action feedback mapper", () => {
  it("maps stale transition code to warning and stale-state recovery", () => {
    const result = mapOrderActionError({
      code: "INVALID_ORDER_STATUS_TRANSITION",
      error: "Invalid transition.",
    });

    expect(result).toEqual({
      severity: "warning",
      message: "Order state changed. The latest order data has been loaded. Please review actions again.",
      staleState: true,
      retryable: false,
    });
  });

  it("maps validation errors to non-retryable error feedback", () => {
    const result = mapOrderActionError({
      code: "VALIDATION_ERROR",
      error: "Invalid payload.",
    });

    expect(result).toEqual({
      severity: "error",
      message: "Invalid payload.",
      staleState: false,
      retryable: false,
    });
  });

  it("maps unknown failures to retryable error feedback", () => {
    const result = mapOrderActionError({});

    expect(result).toEqual({
      severity: "error",
      message: "Unable to complete this action. Please retry.",
      staleState: false,
      retryable: true,
    });
  });
});
