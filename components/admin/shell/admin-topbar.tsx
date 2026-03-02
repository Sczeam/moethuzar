"use client";

import type { RefObject } from "react";
import { ADMIN_A11Y } from "@/lib/admin/a11y-contract";

type AdminTopbarProps = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  mobileNavControlsId?: string;
  isSidebarOpen?: boolean;
  sidebarToggleRef?: RefObject<HTMLButtonElement | null>;
};

export function AdminTopbar({
  title,
  subtitle,
  onOpenSidebar,
  mobileNavControlsId,
  isSidebarOpen = false,
  sidebarToggleRef,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-sepia-border/70 bg-parchment/95 backdrop-blur-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 md:min-h-[72px] md:px-8 xl:px-20">
        <div className="flex items-center gap-2">
          <button
            ref={sidebarToggleRef}
            type="button"
            onClick={onOpenSidebar}
            className={`inline-flex items-center justify-center rounded-full text-ink transition hover:bg-paper-light ${ADMIN_A11Y.target.minInteractive} ${ADMIN_A11Y.focus.ring}`}
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
          <p className="text-base font-semibold text-ink md:text-lg">{title}</p>
          {subtitle ? <p className="hidden text-xs text-charcoal md:block">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden text-xs uppercase tracking-[0.1em] text-charcoal sm:block">Admin Console</p>
          <span className={`inline-flex items-center justify-center rounded-full border border-sepia-border bg-paper-light text-xs font-semibold text-ink md:text-sm ${ADMIN_A11Y.target.compactInteractive}`}>
            AD
          </span>
        </div>
      </div>
    </header>
  );
}
