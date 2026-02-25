import Link from "next/link";
import { AdminDashboardActionControls } from "@/components/admin/dashboard/admin-dashboard-action-controls";
import { AdminRecentOrdersTable } from "@/components/admin/dashboard/admin-recent-orders-table";
import { AdminSalesOverviewCard } from "@/components/admin/dashboard/admin-sales-overview-card";
import { AdminTopProductsCard } from "@/components/admin/dashboard/admin-top-products-card";
import { AdminUrgentSummaryCard } from "@/components/admin/dashboard/admin-urgent-summary-card";
import { formatMoney } from "@/lib/format";
import { getAdminOpsDashboard } from "@/server/services/admin-ops-dashboard.service";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    label: "Open Orders",
    href: "/admin/orders",
    description: "Review new and active orders",
  },
  {
    label: "Open Products",
    href: "/admin/catalog",
    description: "Manage product list and stock",
  },
  {
    label: "Create Product",
    href: "/admin/catalog/new",
    description: "Start a new product draft",
  },
  {
    label: "Shipping Settings",
    href: "/admin/shipping-rules",
    description: "Edit zones and fees",
  },
  {
    label: "Payment Settings",
    href: "/admin/payment-transfer-methods",
    description: "Manage prepaid transfer accounts",
  },
] as const;

export default async function AdminDashboardPage() {
  const opsDashboard = await getAdminOpsDashboard();
  const newOrdersQueue = opsDashboard.queues.find((queue) => queue.id === "new_orders");

  return (
    <main className="space-y-4 md:space-y-8">
      <section className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        <div className="space-y-4 md:space-y-6 xl:col-span-8">
          <AdminUrgentSummaryCard items={opsDashboard.urgentOrders} />

          <section className="grid grid-cols-2 gap-4 md:gap-6" aria-label="Dashboard KPIs">
            <article className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
              <p className="text-sm text-charcoal">New Orders</p>
              <p className="mt-1 text-3xl font-semibold text-ink md:text-4xl">
                {newOrdersQueue?.count ?? 0}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/85 md:text-xs">
                Priority 1 - immediate
              </p>
            </article>
            <article className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
              <p className="text-sm text-charcoal">Today&apos;s Revenue</p>
              <p className="mt-1 text-[clamp(0.9rem,4.6vw,2.5rem)] font-semibold leading-tight text-ink [overflow-wrap:anywhere] md:text-4xl">
                {formatMoney(
                  opsDashboard.dailyMetrics.revenueToday,
                  opsDashboard.dailyMetrics.currency,
                )}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal/85 md:text-xs">
                Updated today
              </p>
            </article>
          </section>

          <AdminRecentOrdersTable orders={opsDashboard.recentOrders} />

          <section
            className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5"
            aria-labelledby="quick-actions-title"
          >
            <h2
              id="quick-actions-title"
              className="text-2xl font-semibold text-ink md:text-3xl"
            >
              Quick Actions
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-xl border border-sepia-border/70 bg-parchment p-3 transition hover:bg-paper-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass md:p-4"
                >
                  <p className="text-base font-semibold text-ink md:text-2xl">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs text-charcoal md:text-sm">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 md:space-y-6 xl:col-span-4">
          <AdminDashboardActionControls />
          <AdminSalesOverviewCard overview={opsDashboard.salesOverview} />
          <AdminTopProductsCard items={opsDashboard.topProducts} />
        </aside>
      </section>
    </main>
  );
}
