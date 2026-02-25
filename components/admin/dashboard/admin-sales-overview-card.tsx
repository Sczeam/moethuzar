import { formatMoney } from "@/lib/format";
import type { SalesOverview } from "@/server/services/admin-ops-dashboard.service";

type AdminSalesOverviewCardProps = {
  overview: SalesOverview;
};

export function AdminSalesOverviewCard({ overview }: AdminSalesOverviewCardProps) {
  const maxSalesAmount = Math.max(...overview.series.map((point) => Number(point.salesAmount)), 1);

  return (
    <section className="rounded-[24px] border border-sepia-border/50 bg-paper-light p-4 shadow-[0_8px_22px_rgba(37,30,24,0.05)] md:p-5" aria-labelledby="admin-sales-overview-title">
      <h3 id="admin-sales-overview-title" className="text-2xl font-semibold text-ink md:text-3xl">
        Sales Overview
      </h3>
      <p className="mt-1 text-sm text-charcoal">{overview.rangeLabel}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-sepia-border/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Sales</p>
          <p className="mt-1 break-words text-xl font-semibold leading-tight text-ink md:text-3xl">
            {formatMoney(overview.totalSales, overview.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-sepia-border/60 p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Total Orders</p>
          <p className="mt-1 text-xl font-semibold leading-tight text-ink md:text-3xl">
            {overview.totalOrders}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-7 gap-2 md:mt-5" aria-label="Last seven days sales bars">
        {overview.series.map((point) => {
          const salesAmount = Number(point.salesAmount);
          const barHeightPercent = Math.max((salesAmount / maxSalesAmount) * 100, salesAmount > 0 ? 10 : 4);
          const dayLabel = point.dayKey.slice(-2);

          return (
            <li key={point.dayKey} className="space-y-2 text-center">
              <div className="flex h-16 items-end justify-center rounded-lg border border-sepia-border/45 bg-parchment px-1 md:h-24">
                <div
                  className="w-4 rounded-sm bg-antique-brass/85"
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
