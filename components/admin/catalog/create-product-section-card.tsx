import type { ReactNode } from "react";

type CreateProductSectionCardProps = {
  title: string;
  subtitle?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CreateProductSectionCard({
  title,
  subtitle,
  hint,
  children,
  className,
}: CreateProductSectionCardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-sepia-border bg-paper-light/70 p-5 shadow-[0_1px_0_rgba(54,41,29,0.04)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-charcoal">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-charcoal/80">{subtitle}</p> : null}
      {hint ? <div className="mt-2 text-xs text-charcoal/80">{hint}</div> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
