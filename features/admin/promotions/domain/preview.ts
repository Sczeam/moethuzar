import type { PromoDraft, PromoPreview } from "./types";

export function evaluatePromoPreview(subtotalPreview: string, draft: PromoDraft): PromoPreview {
  const subtotal = Number(subtotalPreview || "0");
  const value = Number(draft.value || "0");
  const minOrder = Number(draft.minOrderAmount || "0");

  if (!subtotal || !value) {
    return { discount: 0, after: subtotal || 0, reason: "Enter subtotal + value for preview." };
  }

  if (draft.minOrderAmount.trim() && subtotal < minOrder) {
    return { discount: 0, after: subtotal, reason: "Subtotal below minimum order amount." };
  }

  const discount =
    draft.discountType === "PERCENT"
      ? Math.floor((subtotal * value) / 100)
      : Math.min(value, subtotal);

  return { discount, after: Math.max(0, subtotal - discount), reason: "" };
}
