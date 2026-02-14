import { z } from "zod";
import {
  CHECKOUT_TOWNSHIP_CITY_OPTIONS,
  MM_COUNTRIES,
  MM_STATES_AND_DIVISIONS,
} from "@/lib/constants/mm-locations";

export const checkoutSchema = z.object({
  country: z.enum(MM_COUNTRIES),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  customerNote: z.string().trim().max(1000).optional(),
  stateRegion: z.enum(MM_STATES_AND_DIVISIONS),
  townshipCity: z.enum(CHECKOUT_TOWNSHIP_CITY_OPTIONS),
  addressLine1: z.string().trim().min(4).max(255),
  addressLine2: z.string().trim().max(255).optional(),
  postalCode: z.string().trim().max(20).optional(),
  deliveryFeeAmount: z.number().min(0).max(1000000).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
