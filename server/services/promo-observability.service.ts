import { logInfo, logWarn } from "@/lib/observability";

export type PromoDiscountType = "FLAT" | "PERCENT";

export function logPromoApplyPreviewSuccess(payload: {
  requestId?: string;
  guestTokenHash?: string;
  promoCode: string;
  discountType: PromoDiscountType;
  discountValue: number;
  discountAmount: number;
  subtotalBeforeDiscount: number;
  subtotalAfterDiscount: number;
}) {
  logInfo({
    event: "promo.preview_succeeded",
    requestId: payload.requestId ?? null,
    guestTokenHash: payload.guestTokenHash ?? null,
    promoCode: payload.promoCode,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    discountAmount: payload.discountAmount,
    subtotalBeforeDiscount: payload.subtotalBeforeDiscount,
    subtotalAfterDiscount: payload.subtotalAfterDiscount,
  });
}

export function logPromoApplyPreviewRejected(payload: {
  requestId?: string;
  guestTokenHash?: string;
  promoCodeInput: string;
  rejectionCode: string;
  status: number;
}) {
  logWarn({
    event: "promo.preview_rejected",
    requestId: payload.requestId ?? null,
    guestTokenHash: payload.guestTokenHash ?? null,
    promoCodeInput: payload.promoCodeInput,
    rejectionCode: payload.rejectionCode,
    status: payload.status,
  });
}

export function logPromoReservationConflict(payload: {
  promoId: string;
  promoCode: string | null;
  usageLimit: number | null;
  usageCount: number;
}) {
  logWarn({
    event: "promo.reservation_conflict",
    promoId: payload.promoId,
    promoCode: payload.promoCode,
    usageLimit: payload.usageLimit,
    usageCount: payload.usageCount,
  });
}

export function logAdminPromoCreated(payload: {
  requestId?: string;
  adminUserId: string;
  promoId: string;
  promoCode: string;
  isActive: boolean;
}) {
  logInfo({
    event: "admin.promo_created",
    requestId: payload.requestId ?? null,
    adminUserId: payload.adminUserId,
    promoId: payload.promoId,
    promoCode: payload.promoCode,
    isActive: payload.isActive,
  });
}

export function logAdminPromoUpdated(payload: {
  requestId?: string;
  adminUserId: string;
  promoId: string;
  promoCode: string;
  isActive: boolean;
}) {
  logInfo({
    event: "admin.promo_updated",
    requestId: payload.requestId ?? null,
    adminUserId: payload.adminUserId,
    promoId: payload.promoId,
    promoCode: payload.promoCode,
    isActive: payload.isActive,
  });
}

export function logAdminPromoToggled(payload: {
  requestId?: string;
  adminUserId: string;
  promoId: string;
  promoCode: string;
  isActive: boolean;
}) {
  logInfo({
    event: "admin.promo_toggled",
    requestId: payload.requestId ?? null,
    adminUserId: payload.adminUserId,
    promoId: payload.promoId,
    promoCode: payload.promoCode,
    isActive: payload.isActive,
  });
}
