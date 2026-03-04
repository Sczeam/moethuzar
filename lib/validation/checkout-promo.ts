import { z } from "zod";

export const checkoutPromoSchema = z.object({
  promoCode: z.string().trim().min(2).max(64),
});

export type CheckoutPromoInput = z.infer<typeof checkoutPromoSchema>;
