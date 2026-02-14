"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { orderStatusBadgeClass, type UiOrderStatus } from "@/lib/constants/order-status-ui";

type OrderItem = {
  id: string;
  orderCode: string;
  status: UiOrderStatus;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
};

const statuses = ["ALL", "PENDING", "CONFIRMED", "DELIVERING", "DELIVERED", "CANCELLED"];

export default function OrdersClient({ statusFilter }: { statusFilter: string }) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizedStatus = useMemo(() => {
    return statuses.includes(statusFilter) ? statusFilter : "ALL";
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      const query = normalizedStatus !== "ALL" ? `?status=${normalizedStatus}` : "";
      const response = await fetch(`/api/admin/orders${query}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to load orders.");
        setLoading(false);
        return;
      }

      setOrders(data.orders);
      setStatusText("");
      setLoading(false);
    })();
  }, [normalizedStatus]);

  async function onLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Orders</h1>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="btn-secondary"
        >
          Logout
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((status) => {
          const active = status === normalizedStatus;
          const href = status === "ALL" ? "/admin/orders" : `/admin/orders?status=${status}`;
          return (
            <Link
              key={status}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                active ? "bg-teak-brown text-paper-light" : "bg-paper-light text-charcoal"
              }`}
            >
              {status}
            </Link>
          );
        })}
      </div>

      {loading ? <p className="text-charcoal">Loading orders...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto vintage-panel">
          <table className="min-w-full text-sm">
            <thead className="bg-parchment text-left text-charcoal">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-sepia-border/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold underline">
                      {order.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.customerName}</p>
                    <p className="text-charcoal/80">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-charcoal">
                    No orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-seal-wax">{statusText}</p> : null}
    </main>
  );
}
