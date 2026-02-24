import { formatMoney } from "@/lib/format";
import type { SalesOverview } from "@/server/services/admin-ops-dashboard.service";

type AdminSalesOverviewCardProps = {
  overview: SalesOverview;
};

export function AdminSalesOverviewCard({ overview }: AdminSalesOverviewCardProps) {
  const maxSalesAmount = Math.max(...overview.series.map((point) => Number(point.salesAmount)), 1);

  return (
    <section className="vintage-panel p-5" aria-labelledby="admin-sales-overview-title">
      <h3 id="admin-sales-overview-title" className="text-lg font-semibold text-ink">
        Sales Overview
      </h3>
      <p className="mt-1 text-xs text-charcoal">{overview.rangeLabel}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-none border border-sepia-border p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Sales</p>
          <p className="mt-1 text-xl font-semibold text-ink">
            {formatMoney(overview.totalSales, overview.currency)}
          </p>
        </div>
        <div className="rounded-none border border-sepia-border p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Orders</p>
          <p className="mt-1 text-xl font-semibold text-ink">{overview.totalOrders}</p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-7 gap-2" aria-label="Last seven days sales bars">
        {overview.series.map((point) => {
          const salesAmount = Number(point.salesAmount);
          const barHeightPercent = Math.max((salesAmount / maxSalesAmount) * 100, salesAmount > 0 ? 10 : 4);
          const dayLabel = point.dayKey.slice(-2);

          return (
            <li key={point.dayKey} className="space-y-2 text-center">
              <div className="flex h-24 items-end justify-center rounded-none border border-sepia-border/60 bg-paper-light px-1">
                <div
                  className="w-4 bg-antique-brass/75"
                  style={{ height: `${barHeightPercent}%` }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal">{dayLabel}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
