export type AdminPromoStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "EXPIRED"
  | "INACTIVE"
  | "EXHAUSTED";

export function resolveAdminPromoStatus(
  promo: {
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    usageLimit: number | null;
    usageCount: number;
  },
  now: Date,
): AdminPromoStatus {
  if (!promo.isActive) return "INACTIVE";
  if (promo.startsAt && promo.startsAt > now) return "SCHEDULED";
  if (promo.endsAt && promo.endsAt < now) return "EXPIRED";
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) return "EXHAUSTED";
  return "ACTIVE";
}

