import type { DashboardQueueSummary } from "@/server/services/admin-ops-dashboard.service";
import { AdminOpsQueueCard } from "@/components/admin/dashboard/admin-ops-queue-card";

type AdminOpsQueueGridProps = {
  queues: DashboardQueueSummary[];
};

export function AdminOpsQueueGrid({ queues }: AdminOpsQueueGridProps) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {queues.map((queue) => (
        <AdminOpsQueueCard key={queue.id} queue={queue} />
      ))}
    </div>
  );
}
