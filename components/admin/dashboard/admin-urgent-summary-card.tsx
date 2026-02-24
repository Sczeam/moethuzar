import Link from "next/link";
import type { UrgentOrderItem } from "@/server/services/admin-ops-dashboard.service";

type AdminUrgentSummaryCardProps = {
  items: UrgentOrderItem[];
};

export function AdminUrgentSummaryCard({ items }: AdminUrgentSummaryCardProps) {
  if (items.length === 0) {
    return (
      <section className="vintage-panel p-5">
        <p className="text-[32px] leading-none text-seal-wax/65">!</p>
        <p className="mt-2 text-base font-semibold text-ink">No urgent follow-ups right now.</p>
      </section>
    );
  }

  const first = items[0];

  return (
    <section className="vintage-panel p-5" aria-label="Urgent order follow-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-seal-wax/70 text-xl font-semibold text-paper-light">
            !
          </span>
          <div>
            <p className="text-2xl font-semibold leading-tight text-ink">1 order needs urgent follow-up</p>
            <p className="mt-1 text-sm text-charcoal">
            {first.orderCode} - {first.customerName}
            </p>
          </div>
        </div>
        <Link
          href={first.href}
          className="inline-flex min-h-11 items-center rounded-full border border-sepia-border bg-parchment px-5 py-2 text-xl font-semibold text-ink transition hover:bg-paper-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
        >
          Review order
        </Link>
      </div>
    </section>
  );
}
