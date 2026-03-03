import { describe, expect, it } from "vitest";
import {
  evaluatePromoCode,
  normalizePromoCode,
  PROMO_REJECTION_CODES,
  type PromoRuleSnapshot,
} from "@/server/services/promo-engine.service";

const now = new Date("2026-03-03T10:00:00.000Z");

function buildRule(overrides?: Partial<PromoRuleSnapshot>): PromoRuleSnapshot {
  return {
    code: "SUMMER10",
    discountType: "PERCENT",
    value: 10,
    minOrderAmount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    isActive: true,
    ...overrides,
  };
}

describe("promo-engine.service", () => {
  it("normalizes promo code consistently", () => {
    expect(normalizePromoCode("  summer 10  ")).toBe("SUMMER10");
  });

  it("applies flat discount with zero-floor clamp", () => {
    const result = evaluatePromoCode("flat5000", buildRule({ discountType: "FLAT", value: 5000 }), {
      subtotalAmount: 3200,
      now,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountAmount).toBe(3200);
      expect(result.subtotalAfterDiscount).toBe(0);
    }
  });

  it("applies percent discount using MMK floor rounding", () => {
    const result = evaluatePromoCode("save15", buildRule({ discountType: "PERCENT", value: 15 }), {
      subtotalAmount: 9999,
      now,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.discountAmount).toBe(1499);
      expect(result.subtotalAfterDiscount).toBe(8500);
    }
  });

  it("rejects when minimum order amount is not met", () => {
    const result = evaluatePromoCode("SAVE10", buildRule({ minOrderAmount: 50000 }), {
      subtotalAmount: 49999,
      now,
    });

    expect(result).toMatchObject({
      ok: false,
      rejectionCode: PROMO_REJECTION_CODES.MIN_ORDER_NOT_MET,
    });
  });

  it("rejects when promo is outside start/end window", () => {
    const future = evaluatePromoCode(
      "SAVE10",
      buildRule({ startsAt: new Date("2026-03-04T00:00:00.000Z") }),
      {
        subtotalAmount: 100000,
        now,
      }
    );

    expect(future).toMatchObject({
      ok: false,
      rejectionCode: PROMO_REJECTION_CODES.NOT_STARTED,
    });

    const expired = evaluatePromoCode(
      "SAVE10",
      buildRule({ endsAt: new Date("2026-03-02T23:59:59.000Z") }),
      {
        subtotalAmount: 100000,
        now,
      }
    );

    expect(expired).toMatchObject({
      ok: false,
      rejectionCode: PROMO_REJECTION_CODES.EXPIRED,
    });
  });

  it("rejects when usage limit has been reached", () => {
    const result = evaluatePromoCode(
      "SAVE10",
      buildRule({
        usageLimit: 100,
        usageCount: 100,
      }),
      {
        subtotalAmount: 100000,
        now,
      }
    );

    expect(result).toMatchObject({
      ok: false,
      rejectionCode: PROMO_REJECTION_CODES.USAGE_LIMIT_REACHED,
    });
  });
});
