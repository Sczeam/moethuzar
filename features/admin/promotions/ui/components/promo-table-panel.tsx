import { adminStateBadgeClass } from "@/lib/admin/state-clarity";
import { formatMoney } from "@/lib/format";
import { promoStatusMeta } from "@/features/admin/promotions/domain/status";
import type { PromoRow } from "@/features/admin/promotions/domain/types";

type PromoTablePanelProps = {
  rows: PromoRow[];
  loading: boolean;
  onEdit: (row: PromoRow) => void;
  onToggle: (row: PromoRow) => Promise<void>;
};

export function PromoTablePanel({ rows, loading, onEdit, onToggle }: PromoTablePanelProps) {
  return (
    <section className="vintage-panel p-5">
      <h2 className="text-xl font-semibold text-ink">Promo Codes</h2>
      {loading ? <p className="mt-3 text-sm text-charcoal">Loading promo codes...</p> : null}
      {!loading ? (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-parchment text-left text-charcoal">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Rule</th>
                <th className="px-3 py-2">Window</th>
                <th className="px-3 py-2">Usage</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = promoStatusMeta(row.status);
                return (
                  <tr key={row.id} className="border-t border-sepia-border/60">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-ink">{row.code}</p>
                      {row.label ? <p className="text-xs text-charcoal">{row.label}</p> : null}
                    </td>
                    <td className="px-3 py-2">
                      {row.discountType === "PERCENT" ? `${row.value}%` : formatMoney(String(row.value), "MMK")}
                      {row.minOrderAmount !== null ? (
                        <p className="text-xs text-charcoal">Min {formatMoney(String(row.minOrderAmount), "MMK")}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <p>{row.startsAt ? new Date(row.startsAt).toLocaleString() : "No start"}</p>
                      <p className="text-xs text-charcoal">{row.endsAt ? new Date(row.endsAt).toLocaleString() : "No end"}</p>
                    </td>
                    <td className="px-3 py-2">
                      {row.usageCount}
                      {row.usageLimit !== null ? ` / ${row.usageLimit}` : " / unlimited"}
                    </td>
                    <td className="px-3 py-2">
                      <span className={adminStateBadgeClass(status.tone)}>{status.label}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn-secondary" onClick={() => onEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => void onToggle(row)}>
                          {row.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-charcoal">
                    No promo codes yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
