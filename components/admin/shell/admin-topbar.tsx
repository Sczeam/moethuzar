"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminTopbarProps = {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  mobileNavControlsId?: string;
  isSidebarOpen?: boolean;
};

type DashboardNavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Products", href: "/admin/catalog" },
  { label: "Customers", disabled: true },
  { label: "Analytics", disabled: true },
  { label: "Settings", href: "/admin/shipping-rules" },
] as const;

export function AdminTopbar({
  title,
  subtitle,
  onOpenSidebar,
  mobileNavControlsId,
  isSidebarOpen = false,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin";

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

          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-paper-light lg:inline-flex"
            aria-label="Search admin"
            disabled
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.3 13.3 3.2 3.2" />
            </svg>
          </button>
        </div>

        {isDashboard ? (
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 lg:flex">
            <p className="text-[30px] font-semibold tracking-[0.08em] text-ink">MOETHUZAR</p>
            <nav aria-label="Admin top navigation" className="flex items-center gap-1">
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const href = item.href;
                const isActive =
                  !item.disabled &&
                  href &&
                  (pathname === href || pathname.startsWith(`${href}/`));

                if (item.disabled || !href) {
                  return (
                    <span key={item.label} className="rounded-full px-3 py-2 text-sm text-charcoal/55">
                      {item.label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={href}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-paper-light text-ink" : "text-charcoal hover:bg-paper-light/80"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{title}</p>
            {subtitle ? <p className="text-xs text-charcoal">{subtitle}</p> : null}
          </div>
        )}

        {isDashboard ? (
          <p className="text-xl font-semibold tracking-[0.08em] text-ink lg:hidden">MOETHUZAR</p>
        ) : null}

        <p className="hidden text-xs uppercase tracking-[0.1em] text-charcoal sm:block">Admin Console</p>
      </div>
    </header>
  );
}
