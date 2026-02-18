import Link from "next/link";
import type { MutableRefObject, RefObject } from "react";
import type { SiteNavItem } from "@/lib/constants/site-navigation";
import { IconClose } from "@/components/layout/header/icons";

type HeaderNavPanelProps = {
  menuId: string;
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLButtonElement | null>;
  linkRefs: MutableRefObject<Array<HTMLAnchorElement | null>>;
  items: SiteNavItem[];
  currentPathname: string;
  cartItemCount: number;
  onClose: () => void;
};

export function HeaderNavPanel({
  menuId,
  isOpen,
  panelRef,
  overlayRef,
  linkRefs,
  items,
  currentPathname,
  cartItemCount,
  onClose,
}: HeaderNavPanelProps) {
  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return currentPathname === "/";
    }

    if (href === "/") {
      return currentPathname === "/";
    }

    return currentPathname === href || currentPathname.startsWith(`${href}/`);
  };

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
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center border border-paper-light/40 text-paper-light transition hover:border-aged-gold hover:text-aged-gold focus-visible:border-aged-gold focus-visible:text-aged-gold"
            aria-label="Close navigation menu"
          >
            <IconClose />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            href="/#latest-products"
            onClick={onClose}
            className="btn-secondary !min-h-9 !border-paper-light/45 !bg-transparent !px-3 !py-1.5 !text-[11px] !tracking-[0.12em] !text-paper-light hover:!text-aged-gold"
          >
            Shop Now
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            className="btn-secondary !min-h-9 !border-paper-light/45 !bg-transparent !px-3 !py-1.5 !text-[11px] !tracking-[0.12em] !text-paper-light hover:!text-aged-gold"
          >
            Cart {cartItemCount > 0 ? `(${cartItemCount})` : ""}
          </Link>
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
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-3xl font-semibold transition focus-visible:underline sm:text-4xl lg:text-5xl ${
                isActive(item.href)
                  ? "text-aged-gold underline underline-offset-8"
                  : "text-paper-light hover:text-aged-gold focus-visible:text-aged-gold"
              }`}
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

        <div className="mt-8 border-t border-paper-light/20 pt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-aged-gold">Utility (coming soon)</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Contact", "Favourites", "Account"].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon"
                className="min-h-9 border border-paper-light/25 px-2 py-1 text-[11px] uppercase tracking-[0.1em] text-paper-light/50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
