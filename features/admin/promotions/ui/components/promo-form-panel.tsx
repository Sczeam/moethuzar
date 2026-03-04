import { adminDisabledControlClass } from "@/lib/admin/state-clarity";
import type { PromoDiscountType, PromoDraft } from "@/features/admin/promotions/domain/types";
import type { FormEvent } from "react";

type PromoFormPanelProps = {
  editId: string | null;
  draft: PromoDraft;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancelEdit: () => void;
  onDraftChange: (updater: (draft: PromoDraft) => PromoDraft) => void;
};

export function PromoFormPanel({
  editId,
  draft,
  saving,
  onSubmit,
  onCancelEdit,
  onDraftChange,
}: PromoFormPanelProps) {
  return (
    <section className="vintage-panel p-5">
      <h2 className="text-xl font-semibold text-ink">{editId ? "Edit Promo" : "Create Promo"}</h2>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <label className="field-label">
          Promo Code
          <input
            className="field-input mt-1"
            value={draft.code}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, code: event.target.value.toUpperCase() }));
            }}
            placeholder="SUMMER10"
          />
        </label>
        <label className="field-label">
          Label (optional)
          <input
            className="field-input mt-1"
            value={draft.label}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, label: event.target.value }));
            }}
            placeholder="Summer campaign"
          />
        </label>
        <label className="field-label">
          Discount Type
          <select
            className="field-input mt-1"
            value={draft.discountType}
            onChange={(event) => {
              onDraftChange((prev) => ({
                ...prev,
                discountType: event.target.value as PromoDiscountType,
              }));
            }}
          >
            <option value="FLAT">Flat (MMK)</option>
            <option value="PERCENT">Percent (%)</option>
          </select>
        </label>
        <label className="field-label">
          Value
          <input
            className="field-input mt-1"
            value={draft.value}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, value: event.target.value }));
            }}
            placeholder={draft.discountType === "PERCENT" ? "10" : "5000"}
          />
        </label>
        <label className="field-label">
          Min Order Amount (optional)
          <input
            className="field-input mt-1"
            value={draft.minOrderAmount}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, minOrderAmount: event.target.value }));
            }}
            placeholder="100000"
          />
        </label>
        <label className="field-label">
          Usage Limit (optional)
          <input
            className="field-input mt-1"
            value={draft.usageLimit}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, usageLimit: event.target.value }));
            }}
            placeholder="100"
          />
        </label>
        <label className="field-label">
          Starts At (optional)
          <input
            type="datetime-local"
            className="field-input mt-1"
            value={draft.startsAt}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, startsAt: event.target.value }));
            }}
          />
        </label>
        <label className="field-label">
          Ends At (optional)
          <input
            type="datetime-local"
            className="field-input mt-1"
            value={draft.endsAt}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, endsAt: event.target.value }));
            }}
          />
        </label>
        <label className="field-label inline-flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => {
              onDraftChange((prev) => ({ ...prev, isActive: event.target.checked }));
            }}
          />
          Active
        </label>
        <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-2">
          <button className={`btn-primary ${adminDisabledControlClass()}`} disabled={saving}>
            {saving ? "Saving..." : editId ? "Save Changes" : "Create Promo"}
          </button>
          {editId ? (
            <button type="button" className="btn-secondary" onClick={onCancelEdit}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
