import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  customerNote: z.string().trim().max(1000).optional(),
  stateRegion: z.string().trim().min(2).max(120),
  townshipCity: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(4).max(255),
  addressLine2: z.string().trim().max(255).optional(),
  postalCode: z.string().trim().max(20).optional(),
  deliveryFeeAmount: z.number().min(0).max(1000000).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
