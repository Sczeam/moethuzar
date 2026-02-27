import type { ReactNode } from "react";

type CreateProductUploadCardProps = {
  actions: ReactNode;
  dropzone: ReactNode;
  queue?: ReactNode;
  rows: ReactNode;
};

export function CreateProductUploadCard({ actions, dropzone, queue, rows }: CreateProductUploadCardProps) {
  return (
    <div className="space-y-3 rounded-xl border border-sepia-border bg-paper-light/70 p-5 shadow-[0_1px_0_rgba(54,41,29,0.04)]">
      <div className="space-y-4">
        {actions}
        {dropzone}
        {queue ?? null}
      </div>
      <div className="space-y-2">{rows}</div>
    </div>
  );
}
