import Link from "next/link";
import { AdminDashboardActionControls } from "@/components/admin/dashboard/admin-dashboard-action-controls";
import { AdminDailyMetricsStrip } from "@/components/admin/dashboard/admin-daily-metrics-strip";
import { AdminRecentOrdersTable } from "@/components/admin/dashboard/admin-recent-orders-table";
import { AdminOpsQueueGrid } from "@/components/admin/dashboard/admin-ops-queue-grid";
import { AdminSalesOverviewCard } from "@/components/admin/dashboard/admin-sales-overview-card";
import { AdminTopProductsCard } from "@/components/admin/dashboard/admin-top-products-card";
import { AdminUrgentSummaryCard } from "@/components/admin/dashboard/admin-urgent-summary-card";
import { getAdminOpsDashboard } from "@/server/services/admin-ops-dashboard.service";

export const dynamic = "force-dynamic";

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
    <main className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <AdminUrgentSummaryCard items={opsDashboard.urgentOrders} />

          <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-5 shadow-[0_8px_22px_rgba(37,30,24,0.05)]" aria-labelledby="operations-snapshot-title">
            <h2 id="operations-snapshot-title" className="text-3xl font-semibold text-ink">
              Operations Snapshot
            </h2>
            <AdminOpsQueueGrid queues={opsDashboard.queues} />
            <div className="mt-5 border-t border-sepia-border/70 pt-4">
              <AdminDailyMetricsStrip metrics={opsDashboard.dailyMetrics} />
            </div>
          </section>

          <AdminRecentOrdersTable orders={opsDashboard.recentOrders} />

          <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-5 shadow-[0_8px_22px_rgba(37,30,24,0.05)]" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="text-3xl font-semibold text-ink">
              Quick Actions
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-xl border border-sepia-border/70 bg-parchment p-4 transition hover:bg-paper-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                >
                  <p className="text-2xl font-semibold text-ink">{action.label}</p>
                  <p className="mt-1 text-sm text-charcoal">{action.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <AdminDashboardActionControls />
          <AdminSalesOverviewCard overview={opsDashboard.salesOverview} />
          <AdminTopProductsCard items={opsDashboard.topProducts} />
        </aside>
      </section>
    </main>
  );
}
