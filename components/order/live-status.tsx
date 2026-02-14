"use client";

import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";
import { useState } from "react";

function customerStatusMessage(status: UiOrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Your order is pending confirmation. Our team will contact you to confirm details.";
    case "CONFIRMED":
      return "Your order has been confirmed. Please prepare cash for delivery.";
    case "DELIVERING":
      return "Your order is on the way. Please keep your phone available.";
    case "DELIVERED":
      return "Your order has been delivered successfully.";
    case "CANCELLED":
      return "This order was cancelled. Contact support if you need help.";
    default:
      return "Order status is being processed.";
  }
}

type LiveStatusProps = {
  orderCode: string;
  initialStatus: UiOrderStatus;
};

export default function LiveStatus({ orderCode, initialStatus }: LiveStatusProps) {
  const [status, setStatus] = useState<UiOrderStatus>(initialStatus);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [statusText, setStatusText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  async function refreshStatus() {
    setIsRefreshing(true);
    setStatusText("");
    try {
      const response = await fetch(`/api/orders/${orderCode}`, { cache: "no-store" });
      const data: unknown = await response.json();
      const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : null;

      if (!response.ok || !payload?.ok) {
        setStatusText(
          typeof payload?.error === "string" ? payload.error : "Unable to refresh status."
        );
        return;
      }

      const nextStatus =
        payload.order &&
        typeof payload.order === "object" &&
        "status" in payload.order &&
        typeof payload.order.status === "string"
          ? (payload.order.status as UiOrderStatus)
          : null;

      if (!nextStatus) {
        setStatusText("Invalid status response.");
        return;
      }

      setStatus(nextStatus);
      setLastCheckedAt(new Date());
      setStatusText("Status refreshed.");
    } catch {
      setStatusText("Unexpected error while refreshing status.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function copyOrderCode() {
    setIsCopying(true);
    setStatusText("");
    try {
      await navigator.clipboard.writeText(orderCode);
      setStatusText("Order code copied.");
    } catch {
      setStatusText("Unable to copy order code.");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <section className="vintage-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-charcoal">Current Status</p>
          <div className="mt-2">
            <span className={`status-pill ${orderStatusBadgeClass(status)}`}>{status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refreshStatus()}
            disabled={isRefreshing}
            className="btn-secondary disabled:opacity-60"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </button>
          <button
            type="button"
            onClick={() => void copyOrderCode()}
            disabled={isCopying}
            className="btn-secondary disabled:opacity-60"
          >
            {isCopying ? "Copying..." : "Copy Order Code"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-charcoal">{customerStatusMessage(status)}</p>
      {lastCheckedAt ? (
        <p className="mt-2 text-xs text-charcoal/80">
          Last checked: {lastCheckedAt.toLocaleString()}
        </p>
      ) : null}
      {statusText ? <p className="mt-2 text-xs text-charcoal">{statusText}</p> : null}
    </section>
  );
}
