export type UiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export function orderStatusBadgeClass(status: UiOrderStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-antique-brass/20 text-teak-brown";
    case "CONFIRMED":
      return "bg-aged-gold/25 text-teak-brown";
    case "DELIVERING":
      return "bg-teak-brown/15 text-ink";
    case "DELIVERED":
      return "bg-teal-700/15 text-ink";
    case "CANCELLED":
      return "bg-seal-wax/15 text-seal-wax";
    default:
      return "bg-paper-light text-charcoal";
  }
}
