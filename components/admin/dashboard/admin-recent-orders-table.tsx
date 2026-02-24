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
    <section className="vintage-panel p-5" aria-labelledby="admin-recent-orders-title">
      <div className="flex items-center justify-between">
        <h3 id="admin-recent-orders-title" className="text-lg font-semibold text-ink">
          Recent Orders
        </h3>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal">No recent orders available.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-sepia-border/60">
          <table className="w-full min-w-[660px] text-left text-sm">
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
      )}
    </section>
  );
}
