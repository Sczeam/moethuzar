"use client";

import { PromoFormPanel } from "@/features/admin/promotions/ui/components/promo-form-panel";
import { PromoPreviewPanel } from "@/features/admin/promotions/ui/components/promo-preview-panel";
import { PromoTablePanel } from "@/features/admin/promotions/ui/components/promo-table-panel";
import { PromoStatusBanner } from "@/features/admin/promotions/ui/components/promo-status-banner";
import { usePromoAdminController } from "@/features/admin/promotions/application/use-promo-admin-controller";

export default function PromotionsClient() {
  const controller = usePromoAdminController();

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Discounts</h1>
      </div>

      <PromoFormPanel
        editId={controller.editId}
        draft={controller.activeDraft}
        saving={controller.saving}
        onSubmit={controller.editId ? controller.saveEdit : controller.createPromo}
        onCancelEdit={controller.cancelEdit}
        onDraftChange={controller.updateActiveDraft}
      />

      <PromoPreviewPanel
        subtotalPreview={controller.subtotalPreview}
        onSubtotalPreviewChange={controller.setSubtotalPreview}
        preview={controller.preview}
      />

      <PromoTablePanel
        rows={controller.rows}
        loading={controller.loading}
        onEdit={controller.beginEdit}
        onToggle={controller.togglePromo}
      />

      <PromoStatusBanner statusText={controller.statusText} />
    </main>
  );
}
