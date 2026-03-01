import { describe, expect, it } from "vitest";
import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import {
  createShippingRuleFormDraft,
  shippingRuleToFormDraft,
  toShippingRulePayload,
  withFallbackState,
  zonePresetFromZoneKey,
} from "@/lib/admin/shipping-rule-form-adapter";

describe("shipping-rule-form-adapter", () => {
  it("maps known zone keys to preset", () => {
    expect(zonePresetFromZoneKey("YANGON")).toBe(SHIPPING_ZONE_KEYS.YANGON);
    expect(zonePresetFromZoneKey("other myanmar")).toBe(FALLBACK_SHIPPING_ZONE_KEY);
  });

  it("maps unknown zone keys to custom preset", () => {
    expect(zonePresetFromZoneKey("UPPER_MYANMAR")).toBe("CUSTOM");
  });

  it("builds create draft with next sort order", () => {
    const draft = createShippingRuleFormDraft(8);
    expect(draft.sortOrder).toBe("8");
    expect(draft.zonePreset).toBe(SHIPPING_ZONE_KEYS.YANGON);
  });

  it("converts rule to form draft", () => {
    const draft = shippingRuleToFormDraft({
      id: "a",
      zoneKey: SHIPPING_ZONE_KEYS.MANDALAY,
      name: "Mandalay",
      stateRegion: "Mandalay Region",
      townshipCity: "Mandalay",
      feeAmount: 3500,
      freeShippingThreshold: null,
      etaLabel: "2-4 business days",
      isFallback: false,
      isActive: true,
      sortOrder: 2,
    });
    expect(draft.zonePreset).toBe(SHIPPING_ZONE_KEYS.MANDALAY);
    expect(draft.feeAmount).toBe("3500");
  });

  it("forces fallback shape when fallback is enabled", () => {
    const next = withFallbackState(
      {
        ...createShippingRuleFormDraft(1),
        stateRegion: "Yangon Region",
        townshipCity: "Hlaing",
      },
      true,
    );
    expect(next.zonePreset).toBe(FALLBACK_SHIPPING_ZONE_KEY);
    expect(next.stateRegion).toBe("");
    expect(next.townshipCity).toBe("");
  });

  it("maps form draft to payload with integer validation", () => {
    const mapped = toShippingRulePayload(
      {
        ...createShippingRuleFormDraft(4),
        zonePreset: SHIPPING_ZONE_KEYS.YANGON,
        name: "Yangon",
        feeAmount: "2500",
        etaLabel: "1-2 business days",
        freeShippingThreshold: "",
      },
      4,
    );

    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.payload.feeAmount).toBe(2500);
      expect(mapped.payload.sortOrder).toBe(4);
      expect(mapped.payload.country).toBe("Myanmar");
    }
  });

  it("fails payload mapping for invalid fee", () => {
    const mapped = toShippingRulePayload(
      {
        ...createShippingRuleFormDraft(1),
        feeAmount: "not-number",
        etaLabel: "2-4 business days",
      },
      1,
    );
    expect(mapped.ok).toBe(false);
  });
});
