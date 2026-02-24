import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { RecentOrderSummary } from "@/server/services/admin-ops-dashboard.service";

type AdminRecentOrdersTableProps = {
  orders: RecentOrderSummary[];
};

function statusBadgeClass(status: RecentOrderSummary["status"]): string {
  if (status === "PENDING") {
    return "bg-aged-gold/35 text-ink";
  }
  if (status === "CONFIRMED") {
    return "bg-antique-brass/25 text-ink";
  }
  if (status === "DELIVERED") {
    return "bg-teal-700/15 text-ink";
  }
  if (status === "CANCELLED") {
    return "bg-seal-wax/20 text-seal-wax";
  }
  return "bg-paper-light text-charcoal";
}

function paymentMethodLabel(paymentMethod: RecentOrderSummary["paymentMethod"]): string {
  return paymentMethod === "PREPAID_TRANSFER" ? "Prepaid" : "COD";
}

export function AdminRecentOrdersTable({ orders }: AdminRecentOrdersTableProps) {
  return (
    <section className="rounded-[24px] border border-sepia-border/50 bg-paper-light p-4 shadow-[0_8px_22px_rgba(37,30,24,0.05)] md:p-5" aria-labelledby="admin-recent-orders-title">
      <div className="flex items-center justify-between">
        <h3 id="admin-recent-orders-title" className="text-2xl font-semibold text-ink md:text-3xl">
          Recent Orders
        </h3>
        <Link
          href="/admin/orders"
          className="text-sm font-semibold uppercase tracking-[0.08em] text-ink hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal">No recent orders available.</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2 md:hidden" aria-label="Recent orders list">
            {orders.map((order) => (
              <li key={order.orderId} className="rounded-xl border border-sepia-border/60 bg-parchment p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="text-sm font-semibold text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                    >
                      {order.orderCode}
                    </Link>
                    <p className="mt-1 text-sm text-charcoal">{order.customerName}</p>
                  </div>
                  <span className={`inline-flex rounded-none px-2 py-1 text-xs ${statusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-charcoal">
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  <p className="text-right">{paymentMethodLabel(order.paymentMethod)}</p>
                  <p className="col-span-2 text-right text-sm font-semibold text-ink">
                    {formatMoney(order.totalAmount, order.currency)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-sepia-border/60 md:block">
            <table className="w-full min-w-[660px] text-left text-base">
            <thead className="bg-parchment text-charcoal">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-t border-sepia-border/50">
                  <td className="px-3 py-2 font-semibold text-ink">
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                    >
                      {order.orderCode}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-charcoal">{order.customerName}</td>
                  <td className="px-3 py-2 text-charcoal">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-charcoal">{paymentMethodLabel(order.paymentMethod)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-none px-2 py-1 text-xs ${statusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-ink">
                    {formatMoney(order.totalAmount, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
