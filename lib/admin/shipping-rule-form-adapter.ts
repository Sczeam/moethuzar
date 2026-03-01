import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import { ADMIN_VALIDATION_COPY, ADMIN_VALIDATION_FIELDS } from "@/lib/admin/validation-copy";

export type KnownShippingZonePreset =
  | typeof SHIPPING_ZONE_KEYS.YANGON
  | typeof SHIPPING_ZONE_KEYS.MANDALAY
  | typeof SHIPPING_ZONE_KEYS.PYINMANA
  | typeof SHIPPING_ZONE_KEYS.NAY_PYI_DAW
  | typeof FALLBACK_SHIPPING_ZONE_KEY;

export type ShippingZonePreset = KnownShippingZonePreset | "CUSTOM";

export type ShippingRuleRecord = {
  id: string;
  zoneKey: string;
  name: string;
  stateRegion: string | null;
  townshipCity: string | null;
  feeAmount: number;
  freeShippingThreshold: number | null;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ShippingRuleFormDraft = {
  zonePreset: ShippingZonePreset;
  customZoneKey: string;
  name: string;
  stateRegion: string;
  townshipCity: string;
  feeAmount: string;
  freeShippingThreshold: string;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: string;
};

export type ShippingRulePayload = {
  zoneKey: string;
  name: string;
  country: "Myanmar";
  stateRegion: string;
  townshipCity: string;
  feeAmount: number;
  freeShippingThreshold: number | null;
  etaLabel: string;
  isFallback: boolean;
  isActive: boolean;
  sortOrder: number;
};

const KNOWN_ZONE_KEYS: readonly KnownShippingZonePreset[] = [
  SHIPPING_ZONE_KEYS.YANGON,
  SHIPPING_ZONE_KEYS.MANDALAY,
  SHIPPING_ZONE_KEYS.PYINMANA,
  SHIPPING_ZONE_KEYS.NAY_PYI_DAW,
  FALLBACK_SHIPPING_ZONE_KEY,
] as const;

export const SHIPPING_ZONE_PRESET_OPTIONS: readonly { value: ShippingZonePreset; label: string }[] = [
  { value: SHIPPING_ZONE_KEYS.YANGON, label: "Yangon" },
  { value: SHIPPING_ZONE_KEYS.MANDALAY, label: "Mandalay" },
  { value: SHIPPING_ZONE_KEYS.PYINMANA, label: "Pyinmana" },
  { value: SHIPPING_ZONE_KEYS.NAY_PYI_DAW, label: "Nay Pyi Daw" },
  { value: FALLBACK_SHIPPING_ZONE_KEY, label: "Other Myanmar (Fallback)" },
  { value: "CUSTOM", label: "Custom zone key" },
] as const;

function normalizeZoneKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function parseInteger(value: string) {
  if (!value.trim().length) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function defaultNameForPreset(preset: ShippingZonePreset) {
  const found = SHIPPING_ZONE_PRESET_OPTIONS.find((item) => item.value === preset);
  if (!found) return "";
  return found.label.replace(" (Fallback)", "");
}

export function zonePresetFromZoneKey(zoneKey: string): ShippingZonePreset {
  const normalized = normalizeZoneKey(zoneKey);
  return KNOWN_ZONE_KEYS.includes(normalized as KnownShippingZonePreset)
    ? (normalized as KnownShippingZonePreset)
    : "CUSTOM";
}

export function createShippingRuleFormDraft(nextSortOrder = 0): ShippingRuleFormDraft {
  return {
    zonePreset: SHIPPING_ZONE_KEYS.YANGON,
    customZoneKey: "",
    name: defaultNameForPreset(SHIPPING_ZONE_KEYS.YANGON),
    stateRegion: "",
    townshipCity: "",
    feeAmount: "",
    freeShippingThreshold: "",
    etaLabel: "",
    isFallback: false,
    isActive: true,
    sortOrder: String(nextSortOrder),
  };
}

export function shippingRuleToFormDraft(rule: ShippingRuleRecord): ShippingRuleFormDraft {
  const zonePreset = zonePresetFromZoneKey(rule.zoneKey);
  return {
    zonePreset,
    customZoneKey: zonePreset === "CUSTOM" ? rule.zoneKey : "",
    name: rule.name,
    stateRegion: rule.stateRegion ?? "",
    townshipCity: rule.townshipCity ?? "",
    feeAmount: String(rule.feeAmount),
    freeShippingThreshold:
      typeof rule.freeShippingThreshold === "number" ? String(rule.freeShippingThreshold) : "",
    etaLabel: rule.etaLabel,
    isFallback: rule.isFallback,
    isActive: rule.isActive,
    sortOrder: String(rule.sortOrder),
  };
}

export function withZonePreset(draft: ShippingRuleFormDraft, zonePreset: ShippingZonePreset) {
  const fallback = zonePreset === FALLBACK_SHIPPING_ZONE_KEY;
  return {
    ...draft,
    zonePreset,
    isFallback: fallback ? true : draft.isFallback,
    stateRegion: fallback ? "" : draft.stateRegion,
    townshipCity: fallback ? "" : draft.townshipCity,
    name: draft.name.trim().length ? draft.name : defaultNameForPreset(zonePreset),
  };
}

export function withFallbackState(draft: ShippingRuleFormDraft, nextFallback: boolean) {
  if (nextFallback) {
    return {
      ...draft,
      zonePreset: FALLBACK_SHIPPING_ZONE_KEY,
      isFallback: true,
      stateRegion: "",
      townshipCity: "",
      name: draft.name.trim().length ? draft.name : defaultNameForPreset(FALLBACK_SHIPPING_ZONE_KEY),
    };
  }

  return {
    ...draft,
    isFallback: false,
    zonePreset:
      draft.zonePreset === FALLBACK_SHIPPING_ZONE_KEY ? SHIPPING_ZONE_KEYS.YANGON : draft.zonePreset,
  };
}

export function toShippingRulePayload(
  draft: ShippingRuleFormDraft,
  fallbackSortOrder: number,
): { ok: true; payload: ShippingRulePayload } | { ok: false; error: string } {
  const zoneKeySource = draft.zonePreset === "CUSTOM" ? draft.customZoneKey : draft.zonePreset;
  const zoneKey = normalizeZoneKey(zoneKeySource);
  const feeAmount = parseInteger(draft.feeAmount);
  const sortOrder = parseInteger(draft.sortOrder);

  if (!zoneKey.length) {
    return { ok: false, error: ADMIN_VALIDATION_COPY.required(ADMIN_VALIDATION_FIELDS.shipping.zone) };
  }

  if (feeAmount === null || feeAmount < 0) {
    return {
      ok: false,
      error: ADMIN_VALIDATION_COPY.wholeMmkAmount(ADMIN_VALIDATION_FIELDS.shipping.shippingFee),
    };
  }

  const freeShippingThresholdParsed = parseInteger(draft.freeShippingThreshold);
  if (draft.freeShippingThreshold.trim().length && freeShippingThresholdParsed === null) {
    return {
      ok: false,
      error: ADMIN_VALIDATION_COPY.wholeMmkAmount(
        ADMIN_VALIDATION_FIELDS.shipping.freeShippingThreshold,
      ),
    };
  }

  if (!draft.etaLabel.trim().length) {
    return {
      ok: false,
      error: ADMIN_VALIDATION_COPY.required(ADMIN_VALIDATION_FIELDS.shipping.deliveryEta),
    };
  }

  const normalizedFallback =
    draft.isFallback || zoneKey === FALLBACK_SHIPPING_ZONE_KEY || draft.zonePreset === FALLBACK_SHIPPING_ZONE_KEY;
  const resolvedName = draft.name.trim() || defaultNameForPreset(draft.zonePreset) || zoneKey;

  return {
    ok: true,
    payload: {
      zoneKey,
      name: resolvedName,
      country: "Myanmar",
      stateRegion: normalizedFallback ? "" : draft.stateRegion,
      townshipCity: normalizedFallback ? "" : draft.townshipCity,
      feeAmount,
      freeShippingThreshold: freeShippingThresholdParsed,
      etaLabel: draft.etaLabel.trim(),
      isFallback: normalizedFallback,
      isActive: draft.isActive,
      sortOrder: sortOrder ?? fallbackSortOrder,
    },
  };
}
