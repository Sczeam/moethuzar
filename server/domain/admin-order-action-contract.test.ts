import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { buildOrderActionContract } from "@/server/domain/admin-order-action-contract";

describe("admin-order-action-contract", () => {
  it("recommends payment verification first for prepaid pending review", () => {
    const contract = buildOrderActionContract({
      orderStatus: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.PENDING_REVIEW,
      hasPaymentProof: true,
    });

    expect(contract.allowedActions).toContain("payment.verify");
    expect(contract.allowedActions).toContain("payment.reject");
    expect(contract.allowedActions).toContain("status.confirm");
    expect(contract.recommendedAction).toBe("payment.verify");
  });

  it("blocks payment review actions for COD orders", () => {
    const contract = buildOrderActionContract({
      orderStatus: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      hasPaymentProof: false,
    });

    expect(contract.allowedActions).not.toContain("payment.verify");
    expect(contract.allowedActions).not.toContain("payment.reject");
    expect(contract.blockedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "payment.verify",
          reasonKey: "blocked.payment.not_prepaid_transfer",
        }),
        expect.objectContaining({
          actionId: "payment.reject",
          reasonKey: "blocked.payment.not_prepaid_transfer",
        }),
      ]),
    );
  });

  it("blocks payment review if prepaid proof is missing", () => {
    const contract = buildOrderActionContract({
      orderStatus: OrderStatus.PENDING,
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.PENDING_REVIEW,
      hasPaymentProof: false,
    });

    expect(contract.allowedActions).not.toContain("payment.verify");
    expect(contract.blockedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "payment.verify",
          reasonKey: "blocked.payment.proof_missing",
        }),
      ]),
    );
  });

  it("moves recommendation to status flow when payment already reviewed", () => {
    const contract = buildOrderActionContract({
      orderStatus: OrderStatus.CONFIRMED,
      paymentMethod: PaymentMethod.PREPAID_TRANSFER,
      paymentStatus: PaymentStatus.VERIFIED,
      hasPaymentProof: true,
    });

    expect(contract.allowedActions).toContain("status.mark_delivering");
    expect(contract.allowedActions).not.toContain("payment.verify");
    expect(contract.recommendedAction).toBe("status.mark_delivering");
  });

  it("marks terminal orders with no recommended action", () => {
    const contract = buildOrderActionContract({
      orderStatus: OrderStatus.DELIVERED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      hasPaymentProof: false,
    });

    expect(contract.allowedActions).toEqual([]);
    expect(contract.recommendedAction).toBeNull();
    expect(contract.blockedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "status.cancel",
          reasonKey: "blocked.status.already_terminal",
        }),
      ]),
    );
  });
});
