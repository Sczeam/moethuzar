"use client";

import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = UiOrderStatus;

type OrderDetail = {
  id: string;
  orderCode: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  totalAmount: string;
  deliveryFeeAmount: string;
  currency: string;
  shippingZoneKey: string | null;
  shippingZoneLabel: string | null;
  shippingEtaLabel: string | null;
  address: {
    stateRegion: string;
    townshipCity: string;
    addressLine1: string;
    addressLine2: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    lineTotal: string;
  }>;
  history: Array<{
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
  }>;
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

function transitionLabel(status: OrderStatus) {
  switch (status) {
    case "CONFIRMED":
      return "Confirm Order";
    case "DELIVERING":
      return "Mark Delivering";
    case "DELIVERED":
      return "Mark Delivered";
    case "CANCELLED":
      return "Cancel Order";
    default:
      return status;
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusText, setStatusText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<OrderStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState("");
  const router = useRouter();

  const loadOrder = useCallback(async () => {
    setLoadError("");
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setLoadError(data.error ?? "Failed to load order.");
      setStatusText(
        typeof data?.requestId === "string" ? `Request ID: ${data.requestId}` : "Please retry."
      );
      setLoading(false);
      return;
    }

    setOrder(data.order);
    setStatusText("");
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    (async () => {
      await loadOrder();
      setLoading(false);
    })();
  }, [loadOrder]);

  const availableTransitions = useMemo(() => {
    if (!order) {
      return [];
    }
    return statusTransitions[order.status];
  }, [order]);

  const transitionImpactText = useMemo(() => {
    if (!selectedTransition) {
      return null;
    }

    if (selectedTransition === "CANCELLED") {
      return "Cancelling will restore reserved inventory and mark this order as cancelled.";
    }

    if (selectedTransition === "CONFIRMED") {
      return "Confirmation keeps inventory reserved and signals phone confirmation complete.";
    }

    if (selectedTransition === "DELIVERING") {
      return "Use this when the package has left for delivery.";
    }

    if (selectedTransition === "DELIVERED") {
      return "Mark delivered only after successful handoff and COD collection.";
    }

    return null;
  }, [selectedTransition]);

  async function updateStatus() {
    if (!selectedTransition) {
      return;
    }

    if (selectedTransition === "CANCELLED" && transitionNote.trim().length < 4) {
      setStatusText("Please add a cancellation note (at least 4 characters).");
      return;
    }

    setUpdatingStatus(true);
    setStatusText("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: selectedTransition,
          note: transitionNote.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to update status.");
        return;
      }

      setSelectedTransition(null);
      setTransitionNote("");
      setStatusText(`Status updated to ${selectedTransition}.`);
      await loadOrder();
    } catch {
      setStatusText("Unexpected server error while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatusText(successMessage);
    } catch {
      setStatusText("Unable to copy.");
    }
  }

  return (
    <main className="vintage-shell max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            Back to Orders
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            Shipping Rules
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            router.refresh();
            void (async () => {
              await loadOrder();
              setLoading(false);
            })();
          }}
          className="btn-secondary"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-charcoal">Loading order...</p> : null}

      {!loading && loadError ? (
        <section className="vintage-panel border-seal-wax/40 p-5">
          <h2 className="text-xl font-semibold text-ink">Unable to load order</h2>
          <p className="mt-2 text-sm text-charcoal">{loadError}</p>
          {statusText ? <p className="mt-1 text-xs text-charcoal/80">{statusText}</p> : null}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadOrder();
            }}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !loadError && order ? (
        <div className="space-y-6">
          <section className="vintage-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">{order.orderCode}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <p className="text-sm text-charcoal">
                    Total: {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void copyText(order.orderCode, "Order code copied.")}
                className="btn-secondary text-xs"
              >
                Copy Order Code
              </button>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Customer</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-charcoal">{order.customerPhone}</p>
                {order.customerEmail ? <p className="text-sm text-charcoal">{order.customerEmail}</p> : null}
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="btn-primary text-xs"
                >
                  Call Customer
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(order.customerPhone, "Customer phone copied to clipboard.")
                  }
                  className="btn-secondary text-xs"
                >
                  Copy Phone
                </button>
              </div>
            </div>
            {order.address ? (
              <p className="mt-3 text-sm text-charcoal">
                {order.address.addressLine1}
                {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""},{" "}
                {order.address.townshipCity}, {order.address.stateRegion}
              </p>
            ) : null}
            {order.customerNote ? (
              <p className="mt-3 rounded-md bg-parchment p-3 text-sm text-charcoal">
                Customer note: {order.customerNote}
              </p>
            ) : null}
            <div className="mt-3 grid gap-1 text-sm text-charcoal">
              <p>Delivery fee: {Number(order.deliveryFeeAmount).toLocaleString()} MMK</p>
              <p>Shipping zone: {order.shippingZoneLabel ?? order.shippingZoneKey ?? "N/A"}</p>
              <p>Delivery ETA: {order.shippingEtaLabel ?? "N/A"}</p>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <p>
                    {item.productName}
                    {item.variantName ? ` (${item.variantName})` : ""} x {item.quantity}
                  </p>
                  <p>{Number(item.lineTotal).toLocaleString()} MMK</p>
                </div>
              ))}
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Update Status</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => {
                    setSelectedTransition(status);
                    if (status !== "CANCELLED") {
                      setTransitionNote("");
                    }
                  }}
                  className="btn-primary disabled:opacity-60"
                >
                  {transitionLabel(status)}
                </button>
              ))}
              {availableTransitions.length === 0 ? (
                <p className="text-sm text-charcoal">No further transitions available.</p>
              ) : null}
            </div>

            {selectedTransition ? (
              <div className="mt-4 rounded-lg border border-sepia-border bg-parchment p-4">
                <p className="text-sm font-medium">
                  Confirm transition: <span className="font-semibold">{order.status}</span> to{" "}
                  <span className="font-semibold">{selectedTransition}</span>
                </p>
                {transitionImpactText ? (
                  <p
                    className={`mt-2 rounded-md px-3 py-2 text-xs ${
                      selectedTransition === "CANCELLED"
                        ? "border border-seal-wax/40 bg-seal-wax/10 text-seal-wax"
                        : "border border-sepia-border bg-paper-light text-charcoal"
                    }`}
                  >
                    {transitionImpactText}
                  </p>
                ) : null}

                <label className="mt-3 block text-xs font-medium text-charcoal">
                  Transition note {selectedTransition === "CANCELLED" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  value={transitionNote}
                  onChange={(event) => setTransitionNote(event.target.value)}
                  className="mt-1 min-h-20 w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                  placeholder={
                    selectedTransition === "CANCELLED"
                      ? "Reason for cancellation"
                      : "Add an internal note"
                  }
                />

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => void updateStatus()}
                    className="btn-primary disabled:opacity-60"
                  >
                    {updatingStatus ? "Updating..." : "Confirm Status Update"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => {
                      setSelectedTransition(null);
                      setTransitionNote("");
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-lg font-semibold">Status Timeline</h2>
            <div className="mt-3 space-y-3">
              {order.history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-sepia-border bg-parchment px-3 py-2 text-sm text-charcoal"
                >
                  <p>
                    {entry.fromStatus ?? "START"} {"->"} {entry.toStatus}
                  </p>
                  <p className="text-xs text-charcoal/80">{new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note ? <p className="mt-1 text-xs">{entry.note}</p> : null}
                </div>
              ))}
              {order.history.length === 0 ? (
                <p className="text-sm text-charcoal">No status history yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-charcoal">{statusText}</p> : null}
    </main>
  );
}
