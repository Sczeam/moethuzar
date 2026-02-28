import type { ReactNode } from "react";
import Image from "next/image";

type CreateProductPreviewCardProps = {
  imageUrl?: string;
  imageAlt?: string;
  name: string;
  priceLabel: string;
  sizeSummary: string;
  colorSummary: string;
  footerAction?: ReactNode;
};

export function CreateProductPreviewCard({
  imageUrl,
  imageAlt,
  name,
  priceLabel,
  sizeSummary,
  colorSummary,
  footerAction,
}: CreateProductPreviewCardProps) {
  return (
    <div className="rounded-xl border border-sepia-border bg-paper-light/75 p-4 shadow-[0_1px_0_rgba(54,41,29,0.04)]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-sepia-border bg-parchment">
        {imageUrl ? (
          <Image src={imageUrl} alt={imageAlt || name || "Product preview"} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.08em] text-charcoal/70">
            Preview
          </div>
        )}
      </div>
      <div className="mt-4 space-y-1.5">
        <p className="line-clamp-2 text-base font-semibold text-ink">{name || "Untitled product"}</p>
        <p className="text-sm text-charcoal">{priceLabel}</p>
        <p className="text-xs text-charcoal/80">{sizeSummary}</p>
        <p className="text-xs text-charcoal/80">{colorSummary}</p>
      </div>
      {footerAction ? <div className="mt-4">{footerAction}</div> : null}
    </div>
  );
}
