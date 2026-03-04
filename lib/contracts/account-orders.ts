import { z } from "zod";

const ACCOUNT_ORDERS_CURSOR_VERSION = 1 as const;

export const AccountOrdersCursorPayloadSchema = z.object({
  v: z.literal(ACCOUNT_ORDERS_CURSOR_VERSION),
  createdAt: z.string().datetime({ offset: true }),
  id: z.string().uuid(),
});

export type AccountOrdersCursorPayload = z.infer<typeof AccountOrdersCursorPayloadSchema>;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeAccountOrdersCursor(payload: AccountOrdersCursorPayload): string {
  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeAccountOrdersCursor(cursor: string): AccountOrdersCursorPayload | null {
  try {
    const decoded = decodeBase64Url(cursor);
    const parsed = JSON.parse(decoded);
    return AccountOrdersCursorPayloadSchema.parse(parsed);
  } catch {
    return null;
  }
}

export const AccountOrdersQuerySchema = z.object({
  cursor: z.string().min(1).max(512).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type AccountOrdersQuery = z.infer<typeof AccountOrdersQuerySchema>;

const MoneyStringSchema = z.string().min(1);

export const AccountOrderSummarySchema = z.object({
  id: z.string().uuid(),
  orderCode: z.string().min(1),
  status: z.string().min(1),
  paymentStatus: z.string().min(1),
  currency: z.string().min(1),
  totalAmount: MoneyStringSchema,
  itemCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
});

export type AccountOrderSummary = z.infer<typeof AccountOrderSummarySchema>;

export const AccountOrdersResponseSchema = z.object({
  orders: z.array(AccountOrderSummarySchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  pageSize: z.number().int().min(1).max(50),
});

export type AccountOrdersResponse = z.infer<typeof AccountOrdersResponseSchema>;

export const AccountOrderDetailItemSchema = z.object({
  id: z.string().uuid(),
  productName: z.string().min(1),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  unitPrice: MoneyStringSchema,
  quantity: z.number().int().positive(),
  lineTotal: MoneyStringSchema,
});

export const AccountOrderDetailAddressSchema = z.object({
  country: z.string().min(1),
  stateRegion: z.string().min(1),
  townshipCity: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().nullable(),
  postalCode: z.string().nullable(),
});

export const AccountOrderDetailSchema = z.object({
  id: z.string().uuid(),
  orderCode: z.string().min(1),
  status: z.string().min(1),
  paymentMethod: z.string().min(1),
  paymentStatus: z.string().min(1),
  promoCode: z.string().nullable(),
  discountAmount: MoneyStringSchema,
  subtotalAmount: MoneyStringSchema,
  deliveryFeeAmount: MoneyStringSchema,
  totalAmount: MoneyStringSchema,
  currency: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().nullable(),
  customerNote: z.string().nullable(),
  shippingZoneLabel: z.string().nullable(),
  shippingEtaLabel: z.string().nullable(),
  createdAt: z.string().datetime({ offset: true }),
  items: z.array(AccountOrderDetailItemSchema),
  address: AccountOrderDetailAddressSchema.nullable(),
});

export type AccountOrderDetail = z.infer<typeof AccountOrderDetailSchema>;

export const ACCOUNT_ORDERS_RESPONSE_EXAMPLE: AccountOrdersResponse = {
  orders: [
    {
      id: "f9ed219d-56ef-4865-bebe-4bf5ff0f17b0",
      orderCode: "MZT-20260304-191245A1B2C3",
      status: "PENDING",
      paymentStatus: "PENDING_REVIEW",
      currency: "MMK",
      totalAmount: "46000.00",
      itemCount: 3,
      createdAt: "2026-03-04T19:12:45.000Z",
    },
  ],
  nextCursor: "eyJ2IjoxLCJjcmVhdGVkQXQiOiIyMDI2LTAzLTA0VDE5OjEyOjQ1LjAwMFoiLCJpZCI6ImY5ZWQyMTlkLTU2ZWYtNDg2NS1iZWJlLTRiZjVmZjBmMTdiMCJ9",
  hasMore: true,
  pageSize: 20,
};

export const ACCOUNT_ORDER_DETAIL_EXAMPLE: AccountOrderDetail = {
  id: "f9ed219d-56ef-4865-bebe-4bf5ff0f17b0",
  orderCode: "MZT-20260304-191245A1B2C3",
  status: "PENDING",
  paymentMethod: "PREPAID_TRANSFER",
  paymentStatus: "PENDING_REVIEW",
  promoCode: "SUMMER10",
  discountAmount: "2000.00",
  subtotalAmount: "43000.00",
  deliveryFeeAmount: "3000.00",
  totalAmount: "46000.00",
  currency: "MMK",
  customerName: "Aye Aye",
  customerPhone: "0991234567",
  customerEmail: "aye@example.com",
  customerNote: null,
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
  address: {
    country: "Myanmar",
    stateRegion: "Mandalay",
    townshipCity: "Chanayethazan",
    addressLine1: "No. 12, 78th Street",
    addressLine2: null,
    postalCode: null,
  },
};
