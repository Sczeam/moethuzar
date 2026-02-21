import { z } from "zod";

export const transferChannelTypeSchema = z.enum(["BANK", "WALLET"]);

export const paymentTransferMethodPayloadSchema = z
  .object({
    methodCode: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[A-Za-z0-9_ -]+$/),
    label: z.string().trim().min(2).max(120),
    channelType: transferChannelTypeSchema,
    accountName: z.string().trim().min(2).max(120),
    accountNumber: z.string().trim().max(64).optional().or(z.literal("")),
    phoneNumber: z.string().trim().max(32).optional().or(z.literal("")),
    instructions: z.string().trim().max(500).optional().or(z.literal("")),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(9999).default(0),
  })
  .superRefine((value, ctx) => {
    if (value.channelType === "BANK" && !(value.accountNumber ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountNumber"],
        message: "Account number is required for bank transfer methods.",
      });
    }

    if (value.channelType === "WALLET" && !(value.phoneNumber ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Phone number is required for wallet transfer methods.",
      });
    }
  });

export const paymentTransferMethodIdParamSchema = z.object({
  methodId: z.string().uuid(),
});

export type PaymentTransferMethodPayloadInput = z.infer<typeof paymentTransferMethodPayloadSchema>;
