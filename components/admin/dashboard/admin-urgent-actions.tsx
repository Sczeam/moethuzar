import Link from "next/link";
import type { UrgentOrderItem } from "@/server/services/admin-ops-dashboard.service";

type AdminUrgentActionsProps = {
  items: UrgentOrderItem[];
};

function paymentMethodLabel(value: UrgentOrderItem["paymentMethod"]): string {
  if (value === "PREPAID_TRANSFER") {
    return "Prepaid";
  }
  return "COD";
}

export function AdminUrgentActions({ items }: AdminUrgentActionsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-charcoal">No urgent orders right now.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <article key={item.orderId} className="rounded-none border border-sepia-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-ink">{item.orderCode}</p>
              <p className="text-xs text-charcoal">{item.customerName}</p>
              <p className="text-xs text-charcoal">
                {item.status} · {item.paymentStatus} · {paymentMethodLabel(item.paymentMethod)}
              </p>
              <p className="text-xs text-charcoal">
                {Number(item.totalAmount).toLocaleString()} {item.currency}
                {item.zoneLabel ? ` · ${item.zoneLabel}` : ""}
              </p>
            </div>
            <Link
              href={item.href}
              className="inline-flex rounded-none border border-sepia-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink transition hover:bg-parchment focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
              aria-label={`Open order ${item.orderCode}`}
            >
              Open order
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
