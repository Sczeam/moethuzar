import { SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";

export type PaymentPolicy = {
  method: "COD" | "PREPAID_TRANSFER";
  paymentStatus: "NOT_REQUIRED" | "PENDING_REVIEW";
  requiresProof: boolean;
};

export function resolvePaymentPolicyByZone(zoneKey: string | null): PaymentPolicy {
  if (zoneKey === SHIPPING_ZONE_KEYS.YANGON) {
    return {
      method: "COD",
      paymentStatus: "NOT_REQUIRED",
      requiresProof: false,
    };
  }

  return {
    method: "PREPAID_TRANSFER",
    paymentStatus: "PENDING_REVIEW",
    requiresProof: true,
  };
}
