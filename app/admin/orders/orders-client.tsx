"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  orderCode: string;
  status: string;
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-zinc-900">Orders</h1>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
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
              className={`rounded-md px-3 py-1.5 text-sm ${
                active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {status}
            </Link>
          );
        })}
      </div>

      {loading ? <p className="text-zinc-600">Loading orders...</p> : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-600">
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
                <tr key={order.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium underline">
                      {order.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.customerName}</p>
                    <p className="text-zinc-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">
                    {Number(order.totalAmount).toLocaleString()} {order.currency}
                  </td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-red-700">{statusText}</p> : null}
    </main>
  );
}
