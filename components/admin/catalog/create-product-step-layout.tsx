import type { ReactNode } from "react";

type CreateProductStepLayoutProps = {
  preview: ReactNode;
  upload?: ReactNode;
  information: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function CreateProductStepLayout({
  preview,
  upload,
  information,
  action,
  className,
}: CreateProductStepLayoutProps) {
  return (
    <section className={["grid gap-4 lg:grid-cols-[260px_1fr]", className].filter(Boolean).join(" ")}>
      <aside className="space-y-4">{preview}</aside>
      <div className="space-y-4">
        {upload ?? null}
        {information}
      </div>
      {action ? <div className="lg:col-span-2 flex justify-end">{action}</div> : null}
    </section>
  );
}
