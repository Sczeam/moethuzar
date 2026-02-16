import { MM_COUNTRIES, MM_STATES_AND_DIVISIONS, CHECKOUT_TOWNSHIP_CITY_OPTIONS } from "@/lib/constants/mm-locations";
import { FALLBACK_SHIPPING_ZONE_KEY, SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";
import { z } from "zod";

const zoneKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[A-Za-z0-9_ -]+$/);

export const shippingRulePayloadSchema = z
  .object({
    zoneKey: zoneKeySchema,
    name: z.string().trim().min(2).max(120),
    country: z.enum(MM_COUNTRIES),
    stateRegion: z.enum(MM_STATES_AND_DIVISIONS).optional().or(z.literal("")),
    townshipCity: z.enum(CHECKOUT_TOWNSHIP_CITY_OPTIONS).optional().or(z.literal("")),
    feeAmount: z.number().int().min(0).max(1000000),
    freeShippingThreshold: z.number().int().min(0).max(100000000).optional().nullable(),
    etaLabel: z.string().trim().min(2).max(80),
    isFallback: z.boolean(),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, ctx) => {
    const normalizedZoneKey = value.zoneKey.trim().toUpperCase().replace(/\s+/g, "_");
    if (value.isFallback && normalizedZoneKey !== FALLBACK_SHIPPING_ZONE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zoneKey"],
        message: `Fallback rule must use zone key ${FALLBACK_SHIPPING_ZONE_KEY}.`,
      });
    }

    if (!value.isFallback && normalizedZoneKey === FALLBACK_SHIPPING_ZONE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["isFallback"],
        message: "OTHER_MYANMAR zone must be marked as fallback.",
      });
    }

    if (value.feeAmount > 0 && value.freeShippingThreshold === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["freeShippingThreshold"],
        message: "Use null to disable free-shipping threshold.",
      });
    }
  });

export const shippingRuleIdParamSchema = z.object({
  ruleId: z.string().uuid(),
});

export const shippingQuoteSchema = z.object({
  country: z.enum(MM_COUNTRIES),
  stateRegion: z.enum(MM_STATES_AND_DIVISIONS),
  townshipCity: z.enum(CHECKOUT_TOWNSHIP_CITY_OPTIONS),
  subtotalAmount: z.number().int().min(0).max(100000000),
});

export const defaultShippingRulesSeed = [
  {
    zoneKey: SHIPPING_ZONE_KEYS.YANGON,
    name: "Yangon",
    country: "Myanmar",
    stateRegion: "Yangon Region",
    townshipCity: "",
    feeAmount: 2500,
    freeShippingThreshold: null,
    etaLabel: "1-2 business days",
    isFallback: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    zoneKey: SHIPPING_ZONE_KEYS.MANDALAY,
    name: "Mandalay",
    country: "Myanmar",
    stateRegion: "Mandalay Region",
    townshipCity: "Mandalay",
    feeAmount: 3500,
    freeShippingThreshold: null,
    etaLabel: "2-4 business days",
    isFallback: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    zoneKey: SHIPPING_ZONE_KEYS.PYINMANA,
    name: "Pyinmana",
    country: "Myanmar",
    stateRegion: "Mandalay Region",
    townshipCity: "Pyinmana",
    feeAmount: 3500,
    freeShippingThreshold: null,
    etaLabel: "2-4 business days",
    isFallback: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    zoneKey: SHIPPING_ZONE_KEYS.NAY_PYI_DAW,
    name: "Nay Pyi Daw",
    country: "Myanmar",
    stateRegion: "Mandalay Region",
    townshipCity: "Nay Pyi Daw",
    feeAmount: 3500,
    freeShippingThreshold: null,
    etaLabel: "2-4 business days",
    isFallback: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    zoneKey: FALLBACK_SHIPPING_ZONE_KEY,
    name: "Other (Myanmar)",
    country: "Myanmar",
    stateRegion: "",
    townshipCity: "",
    feeAmount: 4500,
    freeShippingThreshold: null,
    etaLabel: "3-6 business days",
    isFallback: true,
    isActive: true,
    sortOrder: 999,
  },
] as const;

export type ShippingRulePayloadInput = z.infer<typeof shippingRulePayloadSchema>;
export type ShippingQuoteInput = z.infer<typeof shippingQuoteSchema>;
