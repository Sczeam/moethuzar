import { formatMoney } from "@/lib/format";

type AdminDailyMetricsStripProps = {
  metrics: {
    ordersToday: number;
    revenueToday: string;
    pendingPaymentReviews: number;
    currency: "MMK";
    refreshedAt: string;
  };
};

export function AdminDailyMetricsStrip({ metrics }: AdminDailyMetricsStripProps) {
  return (
    <section>
      <p className="text-xs text-charcoal">Refreshed {new Date(metrics.refreshedAt).toLocaleString()}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-none border border-sepia-border p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Orders Today</p>
          <p className="mt-1 text-lg font-semibold text-ink">{metrics.ordersToday}</p>
        </div>
        <div className="rounded-none border border-sepia-border p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Revenue Today</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatMoney(metrics.revenueToday, metrics.currency)}
          </p>
        </div>
        <div className="rounded-none border border-sepia-border p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Pending Payment Reviews</p>
          <p className="mt-1 text-lg font-semibold text-ink">{metrics.pendingPaymentReviews}</p>
        </div>
      </div>
    </section>
  );
}
