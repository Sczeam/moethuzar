import Link from "next/link";
import { getAdminOpsDashboard } from "@/server/services/admin-ops-dashboard.service";

const QUICK_ACTIONS = [
  { label: "Open Orders", href: "/admin/orders", description: "Review new and active orders" },
  { label: "Open Products", href: "/admin/catalog", description: "Manage product list and stock" },
  { label: "Create Product", href: "/admin/catalog/new", description: "Start a new product draft" },
  { label: "Shipping Settings", href: "/admin/shipping-rules", description: "Edit zones and fees" },
  {
    label: "Payment Settings",
    href: "/admin/payment-transfer-methods",
    description: "Manage prepaid transfer accounts",
  },
] as const;

export default async function AdminDashboardPage() {
  const opsDashboard = await getAdminOpsDashboard();

  return (
    <main className="vintage-shell space-y-6">
      <section className="vintage-panel p-5">
        <h1 className="text-2xl font-semibold text-ink">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-charcoal">
          Use quick actions below to complete common daily tasks in one click.
        </p>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Operations Snapshot</h2>
        <p className="mt-1 text-xs text-charcoal">
          Refreshed {new Date(opsDashboard.dailyMetrics.refreshedAt).toLocaleString()}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {opsDashboard.queues.map((queue) => (
            <Link
              key={queue.id}
              href={queue.href}
              className="rounded-none border border-sepia-border p-4 hover:bg-parchment"
            >
              <p className="text-xs uppercase tracking-[0.08em] text-charcoal">{queue.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{queue.count}</p>
              <p className="mt-1 text-xs text-charcoal">{queue.helpText}</p>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-none border border-sepia-border p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Orders Today</p>
            <p className="mt-1 text-lg font-semibold text-ink">{opsDashboard.dailyMetrics.ordersToday}</p>
          </div>
          <div className="rounded-none border border-sepia-border p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Revenue Today</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {Number(opsDashboard.dailyMetrics.revenueToday).toLocaleString()}{" "}
              {opsDashboard.dailyMetrics.currency}
            </p>
          </div>
          <div className="rounded-none border border-sepia-border p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Pending Payment Reviews</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {opsDashboard.dailyMetrics.pendingPaymentReviews}
            </p>
          </div>
        </div>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Urgent Actions</h2>
        <div className="mt-3 space-y-2">
          {opsDashboard.urgentOrders.length === 0 ? (
            <p className="text-sm text-charcoal">No urgent orders right now.</p>
          ) : (
            opsDashboard.urgentOrders.map((order) => (
              <Link
                key={order.orderId}
                href={order.href}
                className="block rounded-none border border-sepia-border p-3 hover:bg-parchment"
              >
                <p className="text-sm font-semibold text-ink">{order.orderCode}</p>
                <p className="mt-1 text-xs text-charcoal">
                  {order.customerName} · {order.status} · {order.paymentStatus}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="vintage-panel p-5">
        <h2 className="text-lg font-semibold text-ink">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-none border border-sepia-border p-4 hover:bg-parchment"
            >
              <p className="text-sm font-semibold text-ink">{action.label}</p>
              <p className="mt-1 text-xs text-charcoal">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
