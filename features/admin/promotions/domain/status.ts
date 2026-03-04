import type { AdminPromoStatus } from "./types";

type PromoTone = "neutral" | "info" | "success" | "warning" | "danger";

export function promoStatusMeta(status: AdminPromoStatus): { label: string; tone: PromoTone } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "success" };
    case "SCHEDULED":
      return { label: "Scheduled", tone: "info" };
    case "EXPIRED":
      return { label: "Expired", tone: "neutral" };
    case "INACTIVE":
      return { label: "Inactive", tone: "warning" };
    case "EXHAUSTED":
      return { label: "Exhausted", tone: "danger" };
    default:
      return { label: status, tone: "neutral" };
  }
}
