import { z } from "zod";

const MoneyStringSchema = z.string().min(1);

export const PublicOrderTrackingItemSchema = z.object({
  id: z.string().uuid(),
  productName: z.string().min(1),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  unitPrice: MoneyStringSchema,
  quantity: z.number().int().positive(),
  lineTotal: MoneyStringSchema,
});

export const PublicOrderTrackingOrderSchema = z.object({
  id: z.string().uuid(),
  orderCode: z.string().min(1),
  status: z.string().min(1),
  currency: z.string().min(1),
  subtotalAmount: MoneyStringSchema,
  deliveryFeeAmount: MoneyStringSchema,
  totalAmount: MoneyStringSchema,
  shippingZoneLabel: z.string().nullable(),
  shippingEtaLabel: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  items: z.array(PublicOrderTrackingItemSchema),
});

export const PublicOrderTrackingResponseSchema = z.object({
  ok: z.literal(true),
  order: PublicOrderTrackingOrderSchema,
});

export type PublicOrderTrackingResponse = z.infer<typeof PublicOrderTrackingResponseSchema>;

export const PUBLIC_ORDER_TRACKING_RESPONSE_EXAMPLE: PublicOrderTrackingResponse = {
  ok: true,
  order: {
    id: "f9ed219d-56ef-4865-bebe-4bf5ff0f17b0",
    orderCode: "MZT-20260304-191245A1B2C3",
    status: "DELIVERING",
    currency: "MMK",
    subtotalAmount: "43000.00",
    deliveryFeeAmount: "3000.00",
    totalAmount: "46000.00",
    shippingZoneLabel: "Mandalay",
    shippingEtaLabel: "2-4 business days",
    createdAt: "2026-03-04T19:12:45.000Z",
    items: [
      {
        id: "2b4f51b8-4d2b-4772-a928-79fbd4d0a700",
        productName: "Ruby Blossom Wrap Dress",
        variantName: "Red / M",
        sku: "RBW-RED-M",
        unitPrice: "15000.00",
        quantity: 2,
        lineTotal: "30000.00",
      },
    ],
  },
};
