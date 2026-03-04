import type { PromoDraft, PromoRow, PromoUpsertPayload } from "./types";

export function createEmptyPromoDraft(): PromoDraft {
  return {
    code: "",
    label: "",
    discountType: "FLAT",
    value: "",
    minOrderAmount: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    isActive: true,
  };
}

export function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function toPromoDraft(row: PromoRow): PromoDraft {
  return {
    code: row.code,
    label: row.label ?? "",
    discountType: row.discountType,
    value: String(row.value),
    minOrderAmount: row.minOrderAmount !== null ? String(row.minOrderAmount) : "",
    startsAt: toDateTimeLocal(row.startsAt),
    endsAt: toDateTimeLocal(row.endsAt),
    usageLimit: row.usageLimit !== null ? String(row.usageLimit) : "",
    isActive: row.isActive,
  };
}

export function toPromoUpsertPayload(draft: PromoDraft): PromoUpsertPayload {
  const value = Number(draft.value);
  const minOrderAmount = draft.minOrderAmount.trim() ? Number(draft.minOrderAmount) : null;
  const usageLimit = draft.usageLimit.trim() ? Number(draft.usageLimit) : null;

  return {
    code: draft.code.trim(),
    label: draft.label.trim(),
    discountType: draft.discountType,
    value,
    minOrderAmount,
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
    usageLimit,
    isActive: draft.isActive,
  };
}
