import {
  FULFILLMENT_DENOMINATOR_STATUSES,
  FULFILLMENT_NUMERATOR_STATUSES,
  type OrdersKpiSnapshot,
} from "@/lib/constants/admin-orders-kpi-contract";
import type { UiOrderStatus } from "@/lib/constants/order-status-ui";

type FulfillmentRateInput = {
  deliveredCount: number;
  eligibleCount: number;
};

export function computeFulfillmentRate({
  deliveredCount,
  eligibleCount,
}: FulfillmentRateInput): number {
  if (eligibleCount <= 0) {
    return 0;
  }

  const rawRate = (deliveredCount / eligibleCount) * 100;
  if (!Number.isFinite(rawRate) || rawRate < 0) {
    return 0;
  }

  if (rawRate > 100) {
    return 100;
  }

  return rawRate;
}

export function isFulfillmentNumeratorStatus(status: UiOrderStatus): boolean {
  return (FULFILLMENT_NUMERATOR_STATUSES as ReadonlyArray<UiOrderStatus>).includes(status);
}

export function isFulfillmentDenominatorStatus(status: UiOrderStatus): boolean {
  return (FULFILLMENT_DENOMINATOR_STATUSES as ReadonlyArray<UiOrderStatus>).includes(status);
}

type BuildOrdersKpiSnapshotInput = {
  totalOrders: number;
  totalRevenueAmount: number;
  averageOrderValueAmount: number;
  deliveredCount: number;
  eligibleCount: number;
  currency: string;
  scope: OrdersKpiSnapshot["scope"];
};

export function buildOrdersKpiSnapshot(input: BuildOrdersKpiSnapshotInput): OrdersKpiSnapshot {
  return {
    totalOrders: input.totalOrders,
    totalRevenueAmount: input.totalRevenueAmount,
    averageOrderValueAmount: input.averageOrderValueAmount,
    fulfillmentRate: computeFulfillmentRate({
      deliveredCount: input.deliveredCount,
      eligibleCount: input.eligibleCount,
    }),
    currency: input.currency,
    scope: input.scope,
  };
}
