import { z } from "zod";

export const promoDiscountTypeSchema = z.enum(["FLAT", "PERCENT"]);

export const promoCodePayloadSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[A-Za-z0-9_-]+$/, "Promo code can only include letters, numbers, '-' and '_'."),
    label: z.string().trim().max(120).optional().or(z.literal("")),
    discountType: promoDiscountTypeSchema,
    value: z.number().int().positive(),
    minOrderAmount: z.number().int().min(0).max(100000000).optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    usageLimit: z.number().int().positive().max(100000000).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENT" && (value.value < 1 || value.value > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percent promo value must be between 1 and 100.",
      });
    }

    if (value.discountType === "FLAT" && value.value > 100000000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Flat promo value is too large.",
      });
    }

    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date must be after start date.",
      });
    }
  });

export type PromoCodePayloadInput = z.infer<typeof promoCodePayloadSchema>;
