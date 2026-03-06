import { z } from "zod";
import {
  CHECKOUT_TOWNSHIP_CITY_OPTIONS,
  MM_COUNTRIES,
  MM_STATES_AND_DIVISIONS,
} from "@/lib/constants/mm-locations";
import { LEGAL_TERMS_VERSION } from "@/lib/constants/legal";

const accountIntentSchema = z.object({
  enabled: z.boolean(),
  password: z.string().max(256).optional(),
  confirmPassword: z.string().max(256).optional(),
});

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
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "You must agree to the Terms and Privacy Policy before placing an order.",
  }),
  termsVersion: z.string().refine((value) => value === LEGAL_TERMS_VERSION),
  paymentMethod: z.enum(["COD", "PREPAID_TRANSFER"]).optional(),
  paymentProofUrl: z.url().max(1024).optional().or(z.literal("")),
  paymentReference: z.string().trim().max(120).optional(),
  promoCode: z.string().trim().max(64).optional().or(z.literal("")),
  accountIntent: accountIntentSchema.optional(),
}).superRefine((input, ctx) => {
  if (!input.accountIntent?.enabled) {
    return;
  }

  if (!input.customerEmail || input.customerEmail.trim().length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["customerEmail"],
      message: "Email is required to create an account.",
    });
    return;
  }

  const password = input.accountIntent.password ?? "";
  const confirmPassword = input.accountIntent.confirmPassword ?? "";

  if (password.length < 8) {
    ctx.addIssue({
      code: "custom",
      path: ["accountIntent", "password"],
      message: "Password must be at least 8 characters.",
    });
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    ctx.addIssue({
      code: "custom",
      path: ["accountIntent", "password"],
      message: "Password must include letters and numbers.",
    });
  }

  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["accountIntent", "confirmPassword"],
      message: "Passwords do not match.",
    });
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
