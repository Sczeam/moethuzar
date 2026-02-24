"use client";

import Link from "next/link";

export type AdminNavGroup = {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  children?: Array<{ id: string; label: string; href: string }>;
};

type AdminSidebarProps = {
  groups: AdminNavGroup[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
};

function isGroupActive(pathname: string, group: AdminNavGroup): boolean {
  if (group.children?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))) {
    return true;
  }

  if (!group.href) {
    return false;
  }

  return pathname === group.href || pathname.startsWith(`${group.href}/`);
}

export function AdminSidebar({ groups, pathname, isOpen, onClose }: AdminSidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-40 w-[min(84vw,320px)] border-r border-sepia-border/70 bg-paper-light transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-sepia-border/70 px-4 sm:px-5">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-ink">Moethuzar Admin</p>
        </div>
        <nav aria-label="Admin primary navigation" className="h-[calc(100dvh-4rem)] overflow-y-auto px-3 py-4">
          <ul className="space-y-1.5">
            {groups.map((group) => {
              const active = isGroupActive(pathname, group);
              return (
                <li key={group.id} className="rounded-none border border-transparent px-1 py-1">
                  <div className="space-y-1">
                    {group.href && !group.disabled ? (
                      <Link
                        href={group.href}
                        onClick={onClose}
                        className={`block rounded-none px-3 py-2.5 text-sm font-semibold ${
                          active ? "border border-antique-brass bg-antique-brass/15 text-ink" : "text-charcoal hover:bg-parchment"
                        }`}
                        aria-current={pathname === group.href ? "page" : undefined}
                      >
                        {group.label}
                      </Link>
                    ) : (
                      <p className={`px-3 py-2.5 text-sm font-semibold ${group.disabled ? "text-charcoal/55" : "text-charcoal"}`}>
                        {group.label}
                      </p>
                    )}

                    {group.children?.length ? (
                      <ul className="space-y-1 pl-3">
                        {group.children.map((item) => {
                          const childActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          return (
                            <li key={item.id}>
                              <Link
                                href={item.href}
                                onClick={onClose}
                                className={`block rounded-none px-3 py-2 text-sm ${
                                  childActive
                                    ? "border border-sepia-border bg-parchment text-ink"
                                    : "text-charcoal hover:bg-parchment/80"
                                }`}
                                aria-current={childActive ? "page" : undefined}
                              >
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
