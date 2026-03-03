import type { PromoDiscountType } from "@prisma/client";

export const PROMO_REJECTION_CODES = {
  INVALID_CODE: "PROMO_INVALID_CODE",
  INACTIVE: "PROMO_INACTIVE",
  NOT_STARTED: "PROMO_NOT_STARTED",
  EXPIRED: "PROMO_EXPIRED",
  MIN_ORDER_NOT_MET: "PROMO_MIN_ORDER_NOT_MET",
  USAGE_LIMIT_REACHED: "PROMO_USAGE_LIMIT_REACHED",
  INVALID_CONFIG: "PROMO_INVALID_CONFIG",
} as const;

export type PromoRejectionCode =
  (typeof PROMO_REJECTION_CODES)[keyof typeof PROMO_REJECTION_CODES];

export type PromoRuleSnapshot = {
  code: string;
  discountType: PromoDiscountType;
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
};

export type PromoEvaluationInput = {
  subtotalAmount: number;
  now: Date;
};

export type PromoEvaluationRejected = {
  ok: false;
  rejectionCode: PromoRejectionCode;
  message: string;
  normalizedCode: string;
};

export type PromoEvaluationApplied = {
  ok: true;
  normalizedCode: string;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  discountType: PromoDiscountType;
  discountValue: number;
};

export type PromoEvaluationResult = PromoEvaluationRejected | PromoEvaluationApplied;

export function normalizePromoCode(rawCode: string): string {
  return rawCode.trim().toUpperCase().replace(/\s+/g, "");
}

function reject(
  normalizedCode: string,
  rejectionCode: PromoRejectionCode,
  message: string
): PromoEvaluationRejected {
  return {
    ok: false,
    normalizedCode,
    rejectionCode,
    message,
  };
}

function validatePromoRule(rule: PromoRuleSnapshot, input: PromoEvaluationInput): PromoRejectionCode | null {
  if (!rule.isActive) {
    return PROMO_REJECTION_CODES.INACTIVE;
  }

  if (rule.startsAt && input.now < rule.startsAt) {
    return PROMO_REJECTION_CODES.NOT_STARTED;
  }

  if (rule.endsAt && input.now > rule.endsAt) {
    return PROMO_REJECTION_CODES.EXPIRED;
  }

  if (rule.usageLimit !== null && rule.usageCount >= rule.usageLimit) {
    return PROMO_REJECTION_CODES.USAGE_LIMIT_REACHED;
  }

  if (rule.minOrderAmount !== null && input.subtotalAmount < rule.minOrderAmount) {
    return PROMO_REJECTION_CODES.MIN_ORDER_NOT_MET;
  }

  if (rule.discountType === "PERCENT" && (rule.value < 1 || rule.value > 100)) {
    return PROMO_REJECTION_CODES.INVALID_CONFIG;
  }

  if (rule.discountType === "FLAT" && rule.value < 1) {
    return PROMO_REJECTION_CODES.INVALID_CONFIG;
  }

  return null;
}

function calculateDiscountAmount(rule: PromoRuleSnapshot, subtotalAmount: number): number {
  if (rule.discountType === "FLAT") {
    return Math.min(rule.value, subtotalAmount);
  }

  return Math.floor((subtotalAmount * rule.value) / 100);
}

export function evaluatePromoCode(
  rawCode: string,
  rule: PromoRuleSnapshot,
  input: PromoEvaluationInput
): PromoEvaluationResult {
  const normalizedCode = normalizePromoCode(rawCode);
  if (!normalizedCode) {
    return reject(normalizedCode, PROMO_REJECTION_CODES.INVALID_CODE, "Promo code is required.");
  }

  if (normalizePromoCode(rule.code) !== normalizedCode) {
    return reject(
      normalizedCode,
      PROMO_REJECTION_CODES.INVALID_CODE,
      `Promo ${normalizedCode} is invalid.`
    );
  }

  if (input.subtotalAmount < 0 || !Number.isInteger(input.subtotalAmount)) {
    return reject(
      normalizedCode,
      PROMO_REJECTION_CODES.INVALID_CONFIG,
      "Subtotal must be a non-negative MMK integer."
    );
  }

  const rejectionCode = validatePromoRule(rule, input);
  if (rejectionCode) {
    const message =
      rejectionCode === PROMO_REJECTION_CODES.MIN_ORDER_NOT_MET
        ? `Order subtotal does not meet the minimum for promo ${normalizedCode}.`
        : `Promo ${normalizedCode} is not applicable.`;
    return reject(normalizedCode, rejectionCode, message);
  }

  const subtotalBeforeDiscount = input.subtotalAmount;
  const discountAmount = calculateDiscountAmount(rule, subtotalBeforeDiscount);
  const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - discountAmount);

  return {
    ok: true,
    normalizedCode,
    discountAmount,
    subtotalBeforeDiscount,
    subtotalAfterDiscount,
    discountType: rule.discountType,
    discountValue: rule.value,
  };
}
