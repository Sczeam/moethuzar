import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();

export const adminOrderStatusUpdateSchema = z.object({
  toStatus: z.enum(OrderStatus),
  note: z.string().trim().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.toStatus === OrderStatus.CANCELLED && !data.note?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A cancellation note is required.",
      path: ["note"],
    });
  }
});

export const adminOrderPaymentReviewSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().trim().max(1000).optional(),
});

export const orderIdParamSchema = z.object({
  orderId: uuid,
});

export const adminOrdersListQuerySchema = z.object({
  status: z.enum(OrderStatus).optional(),
  q: z.string().trim().max(120).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  format: z.enum(["json", "csv"]).default("json"),
});

export type AdminOrderStatusUpdateInput = z.infer<
  typeof adminOrderStatusUpdateSchema
>;

export type AdminOrderPaymentReviewInput = z.infer<
  typeof adminOrderPaymentReviewSchema
>;

export type AdminOrdersListQueryInput = z.infer<typeof adminOrdersListQuerySchema>;
