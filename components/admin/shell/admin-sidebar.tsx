"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSidebarGroup } from "@/components/admin/navigation/nav-types";

type AdminSidebarProps = {
  groups: AdminSidebarGroup[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  mobilePanelId?: string;
};

function iconByLabel(label: string): ReactNode {
  const common = "h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.6]";

  if (label === "Dashboard") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <rect x="3" y="3" width="6" height="6" />
        <rect x="11" y="3" width="6" height="6" />
        <rect x="3" y="11" width="6" height="6" />
        <rect x="11" y="11" width="6" height="6" />
      </svg>
    );
  }

  if (label === "Orders") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <rect x="3" y="4" width="14" height="12" rx="1.5" />
        <path d="M3 8h14" />
      </svg>
    );
  }

  if (label === "Products" || label === "Collections") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <path d="M3 8h14M10 3v14" />
      </svg>
    );
  }

  if (label === "Categories") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <circle cx="6" cy="6" r="2" />
        <circle cx="14" cy="6" r="2" />
        <circle cx="6" cy="14" r="2" />
        <circle cx="14" cy="14" r="2" />
      </svg>
    );
  }

  if (label === "Inventory") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <path d="M3 6h14l-2 10H5z" />
        <path d="M7 6V4h6v2" />
      </svg>
    );
  }

  if (label === "Storefront") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <path d="M2 8h16l-1.5 8.5h-13z" />
        <path d="M2.5 8 4 4h12l1.5 4" />
      </svg>
    );
  }

  if (label === "Marketing") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <path d="M3 14h3V6H3zm5 0h3V3H8zm5 0h3V9h-3z" />
      </svg>
    );
  }

  if (label === "Reports") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
        <path d="M4 16V8m5 8V4m5 12v-6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={common}>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 6v8M6 10h8" />
    </svg>
  );
}

export function AdminSidebar({ groups, pathname, isOpen, onClose, mobilePanelId }: AdminSidebarProps) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close admin navigation"
        className={`fixed inset-0 z-30 bg-ink/35 transition lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        id={mobilePanelId}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-40 w-[min(84vw,320px)] border-r border-sepia-border/70 bg-paper-light transition-transform lg:sticky lg:top-0 lg:h-[calc(100dvh-1.5rem)] lg:w-64 lg:translate-x-0 lg:rounded-l-[24px] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-sepia-border/70 px-5">
          <p className="text-xl font-semibold tracking-[0.08em] text-ink">MOETHUZAR ADMIN</p>
        </div>
        <nav aria-label="Admin primary navigation" className="h-[calc(100dvh-4rem)] overflow-y-auto px-3 py-4">
          <ul className="space-y-1.5">
            {groups.map((group) => {
              const href = group.href;
              const isGroupActive =
                Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));
              const groupDisabled = group.disabled || !href;

              return (
                <li key={group.id} className="space-y-1">
                  {groupDisabled ? (
                    <span className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-[18px] text-charcoal/50">
                      {iconByLabel(group.label)}
                      {group.label}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[18px] transition ${
                        isGroupActive
                          ? "border-antique-brass bg-antique-brass/15 text-ink"
                          : "border-transparent text-charcoal hover:bg-parchment"
                      }`}
                      aria-current={isGroupActive ? "page" : undefined}
                    >
                      {iconByLabel(group.label)}
                      {group.label}
                    </Link>
                  )}

                  {group.children?.length ? (
                    <ul className="space-y-1 pl-8">
                      {group.children.map((item) => {
                        const childHref = item.href;
                        const isChildActive =
                          Boolean(childHref) &&
                          (pathname === childHref || pathname.startsWith(`${childHref}/`));
                        const childDisabled = item.disabled || !childHref;

                        if (childDisabled) {
                          return (
                            <li key={item.id}>
                              <span className="block rounded-xl border border-transparent px-3 py-2 text-base text-charcoal/45">
                                {item.label}
                              </span>
                            </li>
                          );
                        }

                        return (
                          <li key={item.id}>
                            <Link
                              href={childHref}
                              onClick={onClose}
                              className={`block rounded-xl border px-3 py-2 text-base transition ${
                                isChildActive
                                  ? "border-sepia-border bg-parchment text-ink"
                                  : "border-transparent text-charcoal hover:bg-parchment/80"
                              }`}
                              aria-current={isChildActive ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
