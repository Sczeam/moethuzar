"use client";

import type { AccountOrderSummary } from "@/lib/contracts/account-orders";
import { adminDisabledControlClass } from "@/lib/admin/state-clarity";
import Link from "next/link";
import { useState } from "react";

type OrdersClientProps = {
  initialOrders: AccountOrderSummary[];
  initialNextCursor: string | null;
  pageSize: number;
};

type OrdersApiPayload = {
  ok: true;
  requestId: string;
  orders: AccountOrderSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  pageSize: number;
};

export default function OrdersClient({
  initialOrders,
  initialNextCursor,
  pageSize,
}: OrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState("");

  const hasMore = Boolean(nextCursor);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setErrorText("");

    try {
      const response = await fetch(
        `/api/account/orders?cursor=${encodeURIComponent(nextCursor)}&pageSize=${pageSize}`,
        { method: "GET", cache: "no-store" }
      );
      const payload = (await response.json()) as OrdersApiPayload | { error?: string };

      if (!response.ok || !("ok" in payload) || !payload.ok) {
        setErrorText("Unable to load more orders right now.");
        return;
      }

      setOrders((previous) => [...previous, ...payload.orders]);
      setNextCursor(payload.nextCursor);
    } catch {
      setErrorText("Unable to load more orders right now.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (orders.length === 0) {
    return (
      <section className="vintage-panel p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-ink">My Orders</h1>
        <p className="mt-2 text-sm text-charcoal">
          You have no linked orders yet. Place your first order to see it here.
        </p>
        <div className="mt-5">
          <Link href="/search" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="vintage-panel p-6 sm:p-8">
      <h1 className="text-2xl font-semibold text-ink">My Orders</h1>
      <p className="mt-2 text-sm text-charcoal">Only orders linked to your signed-in account appear here.</p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-sepia-border/70 text-xs uppercase tracking-[0.08em] text-charcoal/80">
              <th className="px-2 py-3">Order</th>
              <th className="px-2 py-3">Placed</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Payment</th>
              <th className="px-2 py-3">Items</th>
              <th className="px-2 py-3">Total</th>
              <th className="px-2 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-sepia-border/40">
                <td className="px-2 py-3 font-semibold text-ink">{order.orderCode}</td>
                <td className="px-2 py-3 text-charcoal">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-2 py-3 text-charcoal">{order.status}</td>
                <td className="px-2 py-3 text-charcoal">{order.paymentStatus}</td>
                <td className="px-2 py-3 text-charcoal">{order.itemCount}</td>
                <td className="px-2 py-3 text-charcoal">
                  {order.currency} {order.totalAmount}
                </td>
                <td className="px-2 py-3">
                  <Link
                    href={`/order/track?code=${encodeURIComponent(order.orderCode)}`}
                    className="btn-secondary whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errorText ? <p className="mt-4 text-sm text-seal-wax">{errorText}</p> : null}

      {hasMore ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            aria-disabled={loadingMore}
            className={`btn-primary ${adminDisabledControlClass()}`}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

