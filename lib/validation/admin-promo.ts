import { z } from "zod";

export const adminPromoIdParamSchema = z.object({
  promoId: z.string().uuid(),
});

