import { formatMoney } from "@/lib/format";
import type { PromoPreview } from "@/features/admin/promotions/domain/types";

type PromoPreviewPanelProps = {
  subtotalPreview: string;
  onSubtotalPreviewChange: (value: string) => void;
  preview: PromoPreview;
};

export function PromoPreviewPanel({
  subtotalPreview,
  onSubtotalPreviewChange,
  preview,
}: PromoPreviewPanelProps) {
  return (
    <section className="vintage-panel p-5">
      <h2 className="text-xl font-semibold text-ink">Promo Preview</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="field-label">
          Subtotal (MMK)
          <input
            className="field-input mt-1"
            value={subtotalPreview}
            onChange={(event) => onSubtotalPreviewChange(event.target.value)}
            placeholder="100000"
          />
        </label>
        <div className="rounded border border-sepia-border/70 bg-paper-light p-3 text-sm">
          Discount: <span className="font-semibold text-ink">{formatMoney(String(preview.discount), "MMK")}</span>
        </div>
        <div className="rounded border border-sepia-border/70 bg-paper-light p-3 text-sm">
          After discount: <span className="font-semibold text-ink">{formatMoney(String(preview.after), "MMK")}</span>
          {preview.reason ? <p className="mt-1 text-seal-wax">{preview.reason}</p> : null}
        </div>
      </div>
    </section>
  );
}
