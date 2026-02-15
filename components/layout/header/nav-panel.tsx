import Link from "next/link";
import type { MutableRefObject, RefObject } from "react";
import type { SiteNavItem } from "@/lib/constants/site-navigation";

type HeaderNavPanelProps = {
  menuId: string;
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLButtonElement | null>;
  linkRefs: MutableRefObject<Array<HTMLAnchorElement | null>>;
  items: SiteNavItem[];
  onClose: () => void;
};

export function HeaderNavPanel({
  menuId,
  isOpen,
  panelRef,
  overlayRef,
  linkRefs,
  items,
  onClose,
}: HeaderNavPanelProps) {
  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        ref={overlayRef}
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45"
        aria-label="Close navigation menu"
      />

      <div
        id={menuId}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="absolute right-0 top-0 h-screen w-[min(92vw,380px)] border-l border-sepia-border/60 bg-teak-brown p-6 text-paper-light sm:right-16 sm:w-[min(calc(100vw-64px),420px)] sm:p-8 lg:right-[68px] lg:w-[min(calc(100vw-68px),440px)] lg:p-10"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.22em] text-aged-gold">Moethuzar</p>
        </div>

        <nav className="mt-8 grid gap-3 sm:mt-10 sm:gap-4">
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
              className="text-3xl font-semibold text-paper-light transition hover:text-aged-gold focus-visible:text-aged-gold focus-visible:underline sm:text-4xl lg:text-5xl"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 border-t border-paper-light/30 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-aged-gold">Search</p>
          <form action="/search" method="get" onSubmit={onClose} className="mt-3 flex gap-2">
            <label htmlFor="menu-search-query" className="sr-only">
              Search products
            </label>
            <input
              id="menu-search-query"
              name="q"
              placeholder="Search products..."
              className="min-h-10 w-full border border-paper-light/45 bg-transparent px-3 text-sm text-paper-light placeholder:text-paper-light/70 focus:outline-none"
            />
            <button type="submit" className="btn-secondary whitespace-nowrap !border-paper-light/45 !bg-transparent !text-paper-light">
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
