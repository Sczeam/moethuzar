"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERING" | "DELIVERED" | "CANCELLED";

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

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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

  async function updateStatus(toStatus: OrderStatus) {
    setUpdatingStatus(true);
    setStatusText("");

    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatusText(data.error ?? "Failed to update status.");
      setUpdatingStatus(false);
      return;
    }

    await loadOrder();
    setUpdatingStatus(false);
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
            <h1 className="text-2xl font-bold">{order.orderCode}</h1>
            <p className="mt-1 text-sm text-zinc-600">Status: {order.status}</p>
            <p className="mt-1 text-sm text-zinc-600">
              Total: {Number(order.totalAmount).toLocaleString()} {order.currency}
            </p>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Customer</h2>
            <p className="mt-2">{order.customerName}</p>
            <p>{order.customerPhone}</p>
            {order.customerEmail ? <p>{order.customerEmail}</p> : null}
            {order.address ? (
              <p className="mt-2 text-sm text-zinc-600">
                {order.address.addressLine1}, {order.address.townshipCity}, {order.address.stateRegion}
              </p>
            ) : null}
            {order.customerNote ? <p className="mt-2 text-sm">{order.customerNote}</p> : null}
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
                  onClick={() => void updateStatus(status)}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  Mark as {status}
                </button>
              ))}
              {availableTransitions.length === 0 ? (
                <p className="text-sm text-zinc-500">No further transitions available.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Status History</h2>
            <div className="mt-3 space-y-2">
              {order.history.map((entry) => (
                <div key={entry.id} className="text-sm text-zinc-700">
                  <p>
                    {entry.fromStatus ?? "START"} → {entry.toStatus}
                  </p>
                  <p className="text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</p>
                  {entry.note ? <p className="text-xs">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-red-700">{statusText}</p> : null}
    </main>
  );
}
