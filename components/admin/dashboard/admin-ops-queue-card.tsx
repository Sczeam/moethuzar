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

function priorityLabel(priority: DashboardQueueSummary["priority"]): string {
  if (priority === 1) {
    return "Priority 1 - immediate";
  }
  if (priority === 2) {
    return "Priority 2 - today";
  }
  return "Priority 3 - monitor";
}

export function AdminOpsQueueCard({ queue }: AdminOpsQueueCardProps) {
  return (
    <Link
      href={queue.href}
      className={`block rounded-none border p-4 transition hover:bg-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass ${priorityContainerClass(queue.priority)}`}
      aria-label={`Open ${queue.label}. ${priorityLabel(queue.priority)}. ${queue.count} orders.`}
    >
      <p className="text-xs uppercase tracking-[0.08em] text-charcoal">{queue.label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{queue.count}</p>
      <p className="mt-1 text-xs text-charcoal">{queue.helpText}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-charcoal">
        {priorityLabel(queue.priority)}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink">Open queue</p>
    </Link>
  );
}
