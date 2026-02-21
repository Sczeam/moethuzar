import { SHIPPING_ZONE_KEYS } from "@/lib/constants/shipping-zones";

export type PaymentPolicyMethod = "COD" | "PREPAID_TRANSFER";
export type PaymentPolicyStatus = "NOT_REQUIRED" | "PENDING_REVIEW";

export type PaymentPolicy = {
  method: PaymentPolicyMethod;
  paymentStatus: PaymentPolicyStatus;
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
