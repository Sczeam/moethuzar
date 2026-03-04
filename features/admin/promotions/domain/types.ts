export type PromoDiscountType = "FLAT" | "PERCENT";

export type AdminPromoStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED" | "INACTIVE" | "EXHAUSTED";

export type PromoRow = {
  id: string;
  code: string;
  label: string | null;
  discountType: PromoDiscountType;
  value: number;
  minOrderAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  status: AdminPromoStatus;
  createdAt: string;
  updatedAt: string;
};

export type PromoDraft = {
  code: string;
  label: string;
  discountType: PromoDiscountType;
  value: string;
  minOrderAmount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
};

export type PromoUpsertPayload = {
  code: string;
  label: string;
  discountType: PromoDiscountType;
  value: number;
  minOrderAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  isActive: boolean;
};

export type PromoPreview = {
  discount: number;
  after: number;
  reason: string;
};
