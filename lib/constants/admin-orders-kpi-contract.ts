import type { UiOrderStatus } from "@/lib/constants/order-status-ui";

export const ORDERS_KPI_SCOPE = ["ALL_TIME", "FILTERED"] as const;
export type OrdersKpiScope = (typeof ORDERS_KPI_SCOPE)[number];

export const FULFILLMENT_NUMERATOR_STATUSES = ["DELIVERED"] as const satisfies ReadonlyArray<UiOrderStatus>;
export const FULFILLMENT_DENOMINATOR_STATUSES = [
  "CONFIRMED",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
] as const satisfies ReadonlyArray<UiOrderStatus>;

export type OrdersKpiSnapshot = {
  totalOrders: number;
  totalRevenueAmount: number;
  averageOrderValueAmount: number;
  fulfillmentRate: number;
  currency: string;
  scope: OrdersKpiScope;
};

