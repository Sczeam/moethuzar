import Image from "next/image";
import type { TopProductSummary } from "@/server/services/admin-ops-dashboard.service";
import { formatMoney } from "@/lib/format";

type AdminTopProductsCardProps = {
  items: TopProductSummary[];
};

export function AdminTopProductsCard({ items }: AdminTopProductsCardProps) {
  return (
    <section className="rounded-[24px] border border-sepia-border/50 bg-paper-light p-5 shadow-[0_8px_22px_rgba(37,30,24,0.05)]" aria-labelledby="admin-top-products-title">
      <h3 id="admin-top-products-title" className="text-3xl font-semibold text-ink">
        Top Products
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal">No sales data yet for this period.</p>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Top selling products">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 rounded-xl border border-sepia-border/60 bg-parchment p-2.5">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-sepia-border/70 bg-paper-light">
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-sepia-border/20" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-ink">{item.name}</p>
                <p className="text-sm text-charcoal">
                  {formatMoney(item.salesAmount, item.currency)} - {item.unitsSold} sold
                </p>
              </div>
              <span className="text-xl text-charcoal/50" aria-hidden="true">
                ›
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
