import type { OrderActionId } from "@/lib/constants/admin-order-action-contract";
import type { UiOrderStatus } from "@/lib/constants/order-status-ui";

type OrderStatus = UiOrderStatus;

export function buildOrderActionRequest(
  orderId: string,
  actionId: OrderActionId,
  note?: string
): {
  endpoint: string;
  body:
    | { decision: "VERIFIED" | "REJECTED"; note?: string }
    | { toStatus: OrderStatus; note?: string };
} {
  const normalizedNote = note?.trim() || undefined;
  switch (actionId) {
    case "payment.verify":
      return {
        endpoint: `/api/admin/orders/${orderId}/payment`,
        body: { decision: "VERIFIED", note: normalizedNote },
      };
    case "payment.reject":
      return {
        endpoint: `/api/admin/orders/${orderId}/payment`,
        body: { decision: "REJECTED", note: normalizedNote },
      };
    case "status.confirm":
      return {
        endpoint: `/api/admin/orders/${orderId}/status`,
        body: { toStatus: "CONFIRMED", note: normalizedNote },
      };
    case "status.mark_delivering":
      return {
        endpoint: `/api/admin/orders/${orderId}/status`,
        body: { toStatus: "DELIVERING", note: normalizedNote },
      };
    case "status.mark_delivered":
      return {
        endpoint: `/api/admin/orders/${orderId}/status`,
        body: { toStatus: "DELIVERED", note: normalizedNote },
      };
    case "status.cancel":
      return {
        endpoint: `/api/admin/orders/${orderId}/status`,
        body: { toStatus: "CANCELLED", note: normalizedNote },
      };
    default:
      throw new Error(`Unsupported order action: ${actionId}`);
  }
}
