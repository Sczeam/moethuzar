import Link from "next/link";
import type { DashboardQueueSummary } from "@/server/services/admin-ops-dashboard.service";

type AdminOpsQueueCardProps = {
  queue: DashboardQueueSummary;
};

function priorityContainerClass(priority: DashboardQueueSummary["priority"]): string {
  if (priority === 1) {
    return "border-antique-brass bg-antique-brass/10";
  }
  if (priority === 2) {
    return "border-sepia-border bg-paper-light";
  }
  return "border-sepia-border/70 bg-paper-light";
}

export function AdminOpsQueueCard({ queue }: AdminOpsQueueCardProps) {
  return (
    <article className={`rounded-none border p-4 ${priorityContainerClass(queue.priority)}`}>
      <Link href={queue.href} className="block rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass">
        <p className="text-xs uppercase tracking-[0.08em] text-charcoal">{queue.label}</p>
        <p className="mt-1 text-3xl font-semibold text-ink">{queue.count}</p>
        <p className="mt-1 text-xs text-charcoal">{queue.helpText}</p>
      </Link>
      <Link
        href={queue.href}
        className="mt-3 inline-flex rounded-none border border-sepia-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink transition hover:bg-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
        aria-label={`Review now: ${queue.label}`}
      >
        Review now
      </Link>
    </article>
  );
}
