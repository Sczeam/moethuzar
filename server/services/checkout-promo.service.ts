import { prisma } from "@/lib/prisma";
import type { CheckoutPromoInput } from "@/lib/validation/checkout-promo";
import { AppError } from "@/server/errors";
import {
  evaluatePromoCode,
  normalizePromoCode,
  type PromoEvaluationRejected,
  type PromoRuleSnapshot,
} from "@/server/services/promo-engine.service";
import { logPromoReservationConflict } from "@/server/services/promo-observability.service";
import { CartStatus, Prisma } from "@prisma/client";

type PromoRuleRecord = {
  id: string;
  code: string;
  discountType: "FLAT" | "PERCENT";
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
};

export type AppliedPromoSnapshot = {
  promoId: string;
  normalizedCode: string;
  discountType: "FLAT" | "PERCENT";
  discountValue: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
  reserveState: Pick<
    PromoRuleRecord,
    "id" | "usageLimit" | "usageCount" | "isActive" | "startsAt" | "endsAt"
  >;
};

function toPromoRuleSnapshot(rule: PromoRuleRecord): PromoRuleSnapshot {
  return {
    code: rule.code,
    discountType: rule.discountType,
    value: rule.value,
    minOrderAmount: rule.minOrderAmount,
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
    usageLimit: rule.usageLimit,
    usageCount: rule.usageCount,
    isActive: rule.isActive,
  };
}

function toPromoAppError(rejected: PromoEvaluationRejected): AppError {
  const status = rejected.rejectionCode === "PROMO_USAGE_LIMIT_REACHED" ? 409 : 400;
  return new AppError(rejected.message, status, rejected.rejectionCode);
}

async function getPromoRuleByCode(
  tx: Prisma.TransactionClient,
  normalizedCode: string
): Promise<PromoRuleRecord | null> {
  return tx.promoCode.findUnique({
    where: { code: normalizedCode },
    select: {
      id: true,
      code: true,
      discountType: true,
      value: true,
      minOrderAmount: true,
      startsAt: true,
      endsAt: true,
      usageLimit: true,
      usageCount: true,
      isActive: true,
    },
  });
}

export async function evaluatePromoByCode(
  tx: Prisma.TransactionClient,
  promoCode: string,
  subtotalAmount: number,
  now: Date
): Promise<AppliedPromoSnapshot> {
  const normalizedCode = normalizePromoCode(promoCode);
  if (!normalizedCode) {
    throw new AppError("Promo code is required.", 400, "PROMO_INVALID_CODE");
  }

  const promoRule = await getPromoRuleByCode(tx, normalizedCode);
  if (!promoRule) {
    throw new AppError(`Promo ${normalizedCode} is invalid.`, 400, "PROMO_INVALID_CODE");
  }

  const evaluated = evaluatePromoCode(normalizedCode, toPromoRuleSnapshot(promoRule), {
    subtotalAmount,
    now,
  });

  if (!evaluated.ok) {
    throw toPromoAppError(evaluated);
  }

  return {
    promoId: promoRule.id,
    normalizedCode: evaluated.normalizedCode,
    discountType: evaluated.discountType,
    discountValue: evaluated.discountValue,
    discountAmount: evaluated.discountAmount,
    subtotalBeforeDiscount: evaluated.subtotalBeforeDiscount,
    subtotalAfterDiscount: evaluated.subtotalAfterDiscount,
    reserveState: {
      id: promoRule.id,
      usageLimit: promoRule.usageLimit,
      usageCount: promoRule.usageCount,
      isActive: promoRule.isActive,
      startsAt: promoRule.startsAt,
      endsAt: promoRule.endsAt,
    },
  };
}

export async function reservePromoUsage(
  tx: Prisma.TransactionClient,
  promoRule: Pick<
    PromoRuleRecord,
    "id" | "usageLimit" | "usageCount" | "isActive" | "startsAt" | "endsAt"
  >,
  now: Date
): Promise<void> {
  if (!promoRule.isActive) {
    throw new AppError("Promo is not active.", 400, "PROMO_INACTIVE");
  }

  if (promoRule.startsAt && promoRule.startsAt > now) {
    throw new AppError("Promo is not active yet.", 400, "PROMO_NOT_STARTED");
  }

  if (promoRule.endsAt && promoRule.endsAt < now) {
    throw new AppError("Promo has expired.", 400, "PROMO_EXPIRED");
  }

  if (promoRule.usageLimit === null) {
    const reserved = await tx.promoCode.updateMany({
      where: {
        id: promoRule.id,
        usageLimit: null,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
    if (reserved.count === 1) {
      return;
    }

    logPromoReservationConflict({
      promoId: promoRule.id,
      promoCode: null,
      usageLimit: promoRule.usageLimit,
      usageCount: promoRule.usageCount,
    });
    throw new AppError(
      "Promo is no longer active. Please retry with another promo.",
      409,
      "PROMO_RESERVATION_CONFLICT"
    );
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const usageLimit = promoRule.usageLimit;
    if (usageLimit === null) {
      await tx.promoCode.update({
        where: { id: promoRule.id },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
      return;
    }

    if (promoRule.usageCount >= usageLimit) {
      throw new AppError(
        "Promo usage limit has been reached. Please choose another promo.",
        409,
        "PROMO_USAGE_LIMIT_REACHED"
      );
    }

    const reserved = await tx.promoCode.updateMany({
      where: {
        id: promoRule.id,
        usageLimit,
        usageCount: promoRule.usageCount,
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    if (reserved.count === 1) {
      return;
    }

    const latest = await tx.promoCode.findUnique({
      where: { id: promoRule.id },
      select: {
        usageCount: true,
        usageLimit: true,
        isActive: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!latest?.isActive) {
      throw new AppError("Promo is not active.", 400, "PROMO_INACTIVE");
    }

    promoRule.usageCount = latest.usageCount;
    promoRule.usageLimit = latest.usageLimit;
    promoRule.startsAt = latest.startsAt;
    promoRule.endsAt = latest.endsAt;
  }

  logPromoReservationConflict({
    promoId: promoRule.id,
    promoCode: null,
    usageLimit: promoRule.usageLimit,
    usageCount: promoRule.usageCount,
  });
  throw new AppError(
    "Promo could not be reserved. Please retry checkout.",
    409,
    "PROMO_RESERVATION_CONFLICT"
  );
}

function toIntSubtotal(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.floor(numeric));
}

export async function previewPromoForActiveCart(
  guestToken: string,
  payload: CheckoutPromoInput
): Promise<{
  promoCode: string;
  discountType: "FLAT" | "PERCENT";
  discountValue: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
}> {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { guestToken },
      select: {
        status: true,
        items: {
          select: {
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!cart || cart.status !== CartStatus.ACTIVE) {
      throw new AppError("Active cart not found.", 404, "CART_NOT_FOUND");
    }

    if (cart.items.length === 0) {
      throw new AppError("Cart is empty.", 400, "CART_EMPTY");
    }

    const subtotalAmount = toIntSubtotal(
      cart.items.reduce((acc, item) => acc + Number(item.price.toString()) * item.quantity, 0)
    );

    const promo = await evaluatePromoByCode(tx, payload.promoCode, subtotalAmount, new Date());

    return {
      promoCode: promo.normalizedCode,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount: promo.discountAmount,
      subtotalBeforeDiscount: promo.subtotalBeforeDiscount,
      subtotalAfterDiscount: promo.subtotalAfterDiscount,
    };
  });
}
