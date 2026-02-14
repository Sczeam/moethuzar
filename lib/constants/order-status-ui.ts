export type UiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERING"
  | "DELIVERED"
  | "CANCELLED";

export function orderStatusBadgeClass(status: UiOrderStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
      return "bg-sky-100 text-sky-800";
    case "DELIVERING":
      return "bg-indigo-100 text-indigo-800";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}
