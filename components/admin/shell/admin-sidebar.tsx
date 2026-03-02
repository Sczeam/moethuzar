"use client";

import Link from "next/link";
import { useRef, type ReactNode, type RefObject } from "react";
import type { AdminSidebarGroup } from "@/components/admin/navigation/nav-types";
import { ADMIN_A11Y } from "@/lib/admin/a11y-contract";
import { useDialogAccessibility } from "@/lib/admin/use-dialog-accessibility";

type AdminSidebarProps = {
  groups: AdminSidebarGroup[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  mobilePanelId?: string;
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

const SIDEBAR_SECTION_ORDER = [
  "overview",
  "sales",
  "catalog",
  "content",
  "marketing",
  "settings",
] as const;

type SidebarSectionId = (typeof SIDEBAR_SECTION_ORDER)[number];

type SidebarSection = {
  id: SidebarSectionId;
  label: string;
  groups: AdminSidebarGroup[];
};

function sectionByGroup(groupId: string): SidebarSectionId {
  if (groupId === "dashboard" || groupId === "orders") {
    return "overview";
  }
  if (groupId === "reports") {
    return "sales";
  }
  if (groupId === "catalog") {
    return "catalog";
  }
  if (groupId === "storefront") {
    return "content";
  }
  if (groupId === "marketing") {
    return "marketing";
  }
  return "settings";
}

function buildSidebarSections(groups: AdminSidebarGroup[]): SidebarSection[] {
  const labelBySection: Record<SidebarSectionId, string> = {
    overview: "Overview",
    sales: "Sales",
    catalog: "Catalog",
    content: "Content",
    marketing: "Marketing",
    settings: "Settings",
  };

  const grouped = groups.reduce<Record<SidebarSectionId, AdminSidebarGroup[]>>(
    (acc, group) => {
      const section = sectionByGroup(group.id);
      acc[section].push(group);
      return acc;
    },
    {
      overview: [],
      sales: [],
      catalog: [],
      content: [],
      marketing: [],
      settings: [],
    },
  );

  return SIDEBAR_SECTION_ORDER.map((sectionId) => ({
    id: sectionId,
    label: labelBySection[sectionId],
    groups: grouped[sectionId],
  })).filter((section) => section.groups.length > 0);
}

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

function isRouteActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  if (href === "/admin") {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  groups,
  pathname,
  isOpen,
  onClose,
  mobilePanelId,
  restoreFocusRef,
}: AdminSidebarProps) {
  const sections = buildSidebarSections(groups);
  const sidebarRef = useRef<HTMLElement | null>(null);

  useDialogAccessibility({
    isOpen,
    containerRef: sidebarRef,
    onClose,
    restoreFocusRef,
  });

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
        ref={sidebarRef}
        id={mobilePanelId}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-40 w-[min(84vw,330px)] border-r border-sepia-border/70 bg-paper-light transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-[15rem] lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center border-b border-sepia-border/70 px-5">
          <div className="space-y-0.5">
            <p className="text-[1.02rem] font-semibold tracking-[0.08em] text-ink">MOETHUZAR</p>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-charcoal/75">Admin</p>
          </div>
        </div>
        <nav
          aria-label="Admin primary navigation"
          className="h-[calc(100dvh-72px)] overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:w-0"
        >
          <div className="space-y-4">
            {sections.map((section) => (
              <section
                key={section.id}
                className="border-b border-sepia-border/50 pb-4 last:border-b-0 last:pb-0"
                aria-label={section.label}
              >
                <h2 className="px-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-charcoal/80">
                  {section.label}
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {(() => {
                    const activeGroupId = section.groups.find((group) => {
                      if (group.disabled) {
                        return false;
                      }

                      const activeChild = group.children?.find((item) => {
                        if (item.disabled || !item.href) {
                          return false;
                        }
                        return isRouteActive(pathname, item.href);
                      });
                      if (activeChild) {
                        return true;
                      }

                      const groupHref = group.href;
                      if (!groupHref) {
                        return false;
                      }
                      return isRouteActive(pathname, groupHref);
                    })?.id;

                    return section.groups.map((group) => {
                    const href = group.href;
                    const groupDisabled = group.disabled || !href;
                    const activeChildId = group.children?.find((item) => {
                      if (item.disabled || !item.href) {
                        return false;
                      }
                      return isRouteActive(pathname, item.href);
                    })?.id;
                    const isGroupActive = group.id === activeGroupId;

                    return (
                      <li key={group.id} className="space-y-1">
                        {groupDisabled ? (
                          <span className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base text-charcoal/45 ${ADMIN_A11Y.target.minInteractive}`}>
                            {iconByLabel(group.label)}
                            {group.label}
                          </span>
                        ) : (
                          <Link
                            href={href}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition ${
                              isGroupActive
                                ? "bg-parchment text-ink"
                                : "text-charcoal hover:bg-parchment/85"
                            } ${ADMIN_A11Y.target.minInteractive} ${ADMIN_A11Y.focus.ring}`}
                            aria-current={isGroupActive ? "page" : undefined}
                          >
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                                isGroupActive
                                  ? "bg-antique-brass/20 text-ink"
                                  : "text-charcoal/85"
                              }`}
                            >
                              {iconByLabel(group.label)}
                            </span>
                            {group.label}
                          </Link>
                        )}

                        {group.children?.length ? (
                          <ul className="space-y-0.5 pl-8">
                            {group.children.map((item) => {
                              const childHref = item.href;
                              const isChildActive = item.id === activeChildId;
                              const childDisabled = item.disabled || !childHref;

                              if (childDisabled) {
                                return (
                                  <li key={item.id}>
                                    <span className={`block rounded-lg px-3 py-2 text-base text-charcoal/45 ${ADMIN_A11Y.target.compactInteractive}`}>
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
                                    className={`block rounded-lg px-3 py-1.5 text-[15px] transition ${
                                      isChildActive
                                        ? "bg-parchment text-ink"
                                        : "text-charcoal hover:bg-parchment/80"
                                    } ${ADMIN_A11Y.target.compactInteractive} ${ADMIN_A11Y.focus.ring}`}
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
                  });
                  })()}
                </ul>
              </section>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
