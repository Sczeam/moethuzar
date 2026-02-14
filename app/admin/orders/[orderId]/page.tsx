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
  currency: string;
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
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<OrderStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState("");
  const router = useRouter();

  const loadOrder = useCallback(async () => {
    const response = await fetch(`/api/admin/orders/${orderId}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatusText(data.error ?? "Failed to load order.");
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/orders" className="text-sm text-zinc-600 underline">
          Back to Orders
        </Link>
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
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-zinc-600">Loading order...</p> : null}

      {!loading && order ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
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
                  <p className="text-sm text-zinc-600">
                    Total: {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void copyText(order.orderCode, "Order code copied.")}
                className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium"
              >
                Copy Order Code
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Customer</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-zinc-600">{order.customerPhone}</p>
                {order.customerEmail ? <p className="text-sm text-zinc-600">{order.customerEmail}</p> : null}
              </div>
              <div className="flex flex-wrap items-start justify-end gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white"
                >
                  Call Customer
                </a>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(order.customerPhone, "Customer phone copied to clipboard.")
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium"
                >
                  Copy Phone
                </button>
              </div>
            </div>
            {order.address ? (
              <p className="mt-3 text-sm text-zinc-700">
                {order.address.addressLine1}
                {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""},{" "}
                {order.address.townshipCity}, {order.address.stateRegion}
              </p>
            ) : null}
            {order.customerNote ? (
              <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                Customer note: {order.customerNote}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
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

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
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
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {transitionLabel(status)}
                </button>
              ))}
              {availableTransitions.length === 0 ? (
                <p className="text-sm text-zinc-500">No further transitions available.</p>
              ) : null}
            </div>

            {selectedTransition ? (
              <div className="mt-4 rounded-lg border border-zinc-300 bg-zinc-50 p-4">
                <p className="text-sm font-medium">
                  Confirm transition: <span className="font-semibold">{order.status}</span> to{" "}
                  <span className="font-semibold">{selectedTransition}</span>
                </p>

                <label className="mt-3 block text-xs font-medium text-zinc-700">
                  Transition note {selectedTransition === "CANCELLED" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  value={transitionNote}
                  onChange={(event) => setTransitionNote(event.target.value)}
                  className="mt-1 min-h-20 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
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
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Status Timeline</h2>
            <div className="mt-3 space-y-3">
              {order.history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                >
                  <p>
                    {entry.fromStatus ?? "START"} {"->"} {entry.toStatus}
                  </p>
                  <p className="text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note ? <p className="mt-1 text-xs">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-zinc-800">{statusText}</p> : null}
    </main>
  );
}
