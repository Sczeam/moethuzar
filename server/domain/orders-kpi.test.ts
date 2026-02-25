import { describe, expect, it } from "vitest";
import {
  buildOrdersKpiSnapshot,
  computeFulfillmentRate,
  isFulfillmentDenominatorStatus,
  isFulfillmentNumeratorStatus,
} from "@/server/domain/orders-kpi";

describe("orders KPI formula", () => {
  it("returns 0 when denominator is zero", () => {
    expect(computeFulfillmentRate({ deliveredCount: 0, eligibleCount: 0 })).toBe(0);
    expect(computeFulfillmentRate({ deliveredCount: 3, eligibleCount: 0 })).toBe(0);
  });

  it("returns ratio in percent for valid values", () => {
    expect(computeFulfillmentRate({ deliveredCount: 0, eligibleCount: 4 })).toBe(0);
    expect(computeFulfillmentRate({ deliveredCount: 3, eligibleCount: 5 })).toBe(60);
    expect(computeFulfillmentRate({ deliveredCount: 5, eligibleCount: 5 })).toBe(100);
  });

  it("clamps invalid values to safe bounds", () => {
    expect(computeFulfillmentRate({ deliveredCount: -2, eligibleCount: 5 })).toBe(0);
    expect(computeFulfillmentRate({ deliveredCount: 9, eligibleCount: 5 })).toBe(100);
  });
});

describe("orders KPI status eligibility", () => {
  it("marks only DELIVERED as numerator status", () => {
    expect(isFulfillmentNumeratorStatus("DELIVERED")).toBe(true);
    expect(isFulfillmentNumeratorStatus("CONFIRMED")).toBe(false);
    expect(isFulfillmentNumeratorStatus("PENDING")).toBe(false);
  });

  it("marks fulfillment denominator statuses", () => {
    expect(isFulfillmentDenominatorStatus("CONFIRMED")).toBe(true);
    expect(isFulfillmentDenominatorStatus("DELIVERING")).toBe(true);
    expect(isFulfillmentDenominatorStatus("DELIVERED")).toBe(true);
    expect(isFulfillmentDenominatorStatus("CANCELLED")).toBe(true);
    expect(isFulfillmentDenominatorStatus("PENDING")).toBe(false);
  });
});

describe("buildOrdersKpiSnapshot", () => {
  it("returns a normalized snapshot contract", () => {
    const snapshot = buildOrdersKpiSnapshot({
      totalOrders: 22,
      totalRevenueAmount: 220000,
      averageOrderValueAmount: 10000,
      deliveredCount: 9,
      eligibleCount: 15,
      currency: "MMK",
      scope: "FILTERED",
    });

    expect(snapshot).toEqual({
      totalOrders: 22,
      totalRevenueAmount: 220000,
      averageOrderValueAmount: 10000,
      fulfillmentRate: 60,
      currency: "MMK",
      scope: "FILTERED",
    });
  });
});

