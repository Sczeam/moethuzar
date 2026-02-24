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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-paper-light"
            aria-label="Open admin navigation"
            aria-controls={mobileNavControlsId}
            aria-expanded={isSidebarOpen}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-ink">{title}</p>
          {subtitle ? <p className="text-xs text-charcoal">{subtitle}</p> : null}
        </div>
        <p className="hidden text-xs uppercase tracking-[0.1em] text-charcoal sm:block">Admin Console</p>
      </div>
    </header>
  );
}
