import Link from "next/link";
import type { UrgentOrderItem } from "@/server/services/admin-ops-dashboard.service";

type AdminUrgentSummaryCardProps = {
  items: UrgentOrderItem[];
};

export function AdminUrgentSummaryCard({ items }: AdminUrgentSummaryCardProps) {
  if (items.length === 0) {
    return (
      <section className="vintage-panel p-4">
        <p className="text-sm font-semibold text-ink">No urgent follow-ups right now.</p>
      </section>
    );
  }

  const first = items[0];

  return (
    <section className="vintage-panel p-4" aria-label="Urgent order follow-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink">Urgent follow-up needed</p>
          <p className="mt-1 text-sm text-charcoal">
            {first.orderCode} - {first.customerName}
          </p>
        </div>
        <Link
          href={first.href}
          className="inline-flex min-h-10 items-center rounded-none border border-sepia-border px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink transition hover:bg-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
        >
          Review order
        </Link>
      </div>
    </section>
  );
}
