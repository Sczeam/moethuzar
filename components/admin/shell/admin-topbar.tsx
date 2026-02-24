"use client";

type AdminTopbarProps = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  mobileNavControlsId?: string;
  isSidebarOpen?: boolean;
};

export function AdminTopbar({
  title,
  subtitle,
  onOpenSidebar,
  mobileNavControlsId,
  isSidebarOpen = false,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-sepia-border/70 bg-parchment/95 backdrop-blur-sm">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center border border-sepia-border text-ink transition hover:bg-paper-light lg:hidden"
            aria-label="Open admin navigation"
            aria-controls={mobileNavControlsId}
            aria-expanded={isSidebarOpen}
          >
            <span aria-hidden="true" className="text-base leading-none">
              ≡
            </span>
          </button>
          <div>
            <p className="text-lg font-semibold text-ink">{title}</p>
            {subtitle ? <p className="text-xs text-charcoal">{subtitle}</p> : null}
          </div>
        </div>
        <p className="hidden text-xs uppercase tracking-[0.1em] text-charcoal sm:block">Admin Console</p>
      </div>
    </header>
  );
}
