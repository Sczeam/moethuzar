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

export const orderIdParamSchema = z.object({
  orderId: uuid,
});

export type AdminOrderStatusUpdateInput = z.infer<
  typeof adminOrderStatusUpdateSchema
>;
