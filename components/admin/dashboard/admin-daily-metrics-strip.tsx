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
    <section aria-label="Daily summary metrics">
      <p className="text-xs text-charcoal">Refreshed {new Date(metrics.refreshedAt).toLocaleString()}</p>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-none border border-sepia-border p-3">
          <dt className="text-xs uppercase tracking-[0.08em] text-charcoal">Orders Today</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{metrics.ordersToday}</dd>
        </div>
        <div className="rounded-none border border-sepia-border p-3">
          <dt className="text-xs uppercase tracking-[0.08em] text-charcoal">Revenue Today</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">
            {formatMoney(metrics.revenueToday, metrics.currency)}
          </dd>
        </div>
        <div className="rounded-none border border-sepia-border p-3">
          <dt className="text-xs uppercase tracking-[0.08em] text-charcoal">Pending Payment Reviews</dt>
          <dd className="mt-1 text-lg font-semibold text-ink">{metrics.pendingPaymentReviews}</dd>
        </div>
      </dl>
    </section>
  );
}
