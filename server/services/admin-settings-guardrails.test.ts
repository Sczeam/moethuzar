import { describe, expect, it } from "vitest";
import {
  getPaymentDeleteWarning,
  getPaymentHealth,
  getShippingDeleteWarning,
  getShippingHealth,
} from "@/lib/admin/settings-guardrails";
import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";

describe("admin settings guardrails", () => {
  it("computes shipping health and missing required zones", () => {
    const health = getShippingHealth([
      {
        id: "1",
        zoneKey: SHIPPING_ZONE_KEYS.YANGON,
        name: "Yangon",
        stateRegion: null,
        townshipCity: null,
        feeAmount: 2500,
        freeShippingThreshold: null,
        etaLabel: "1-2 days",
        isFallback: false,
        isActive: true,
        sortOrder: 1,
      },
    ]);
    expect(health.hasActiveFallback).toBe(false);
    expect(health.missingRequiredZoneKeys).toContain(FALLBACK_SHIPPING_ZONE_KEY);
    expect(health.warnings.length).toBeGreaterThan(0);
  });

  it("computes payment health warning for zero active methods", () => {
    const health = getPaymentHealth([
      {
        id: "a",
        methodCode: "KBZ_PAY",
        label: "KBZ Pay",
        channelType: "WALLET",
        accountName: "M",
        accountNumber: null,
        phoneNumber: "09",
        instructions: null,
        isActive: false,
        sortOrder: 1,
      },
    ]);

    expect(health.activeCount).toBe(0);
    expect(health.warnings[0]).toContain("No active transfer methods");
  });

  it("returns contextual delete warnings", () => {
    expect(
      getShippingDeleteWarning({ name: "Other Myanmar", isFallback: true, isActive: true }),
    ).toContain("fallback coverage");
    expect(
      getPaymentDeleteWarning({ label: "KBZ", isActive: true }, 1),
    ).toContain("Cannot delete the last active method");
  });
});
