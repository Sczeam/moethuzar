import Link from "next/link";
import type { RefObject } from "react";
import { IconClose } from "@/components/layout/header/icons";

type HeaderNavPanelProps = {
  menuId: string;
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  currentPathname: string;
  onClose: () => void;
  onOpenCart: () => void;
};

const shopLinks = [
  { href: "/#latest-products", label: "New In" },
  { href: "/#latest-products", label: "Dresses" },
  { href: "/#latest-products", label: "Sets / Co-ords" },
  { href: "/#latest-products", label: "Best Sellers" },
];

const utilityLinks = [
  { href: "/order/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

const editorialLinks = [
  { href: "/#latest-products", label: "Lookbook" },
  { href: "/contact", label: "About" },
];

export function HeaderNavPanel({
  menuId,
  isOpen,
  panelRef,
  currentPathname,
  onClose,
  onOpenCart,
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
    <div
      id={menuId}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      className={`fixed left-0 top-0 z-[60] h-[100dvh] w-full max-w-none border-r border-sepia-border/60 bg-parchment p-5 text-ink sm:max-w-[min(40vw,420px)] sm:p-6 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-charcoal/80">Moethuzar</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center border border-sepia-border text-ink transition hover:opacity-75"
          aria-label="Close navigation menu"
        >
          <IconClose />
        </button>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Shop</p>
        <nav className="mt-3 grid gap-3">
          {shopLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-2xl font-semibold leading-tight transition hover:opacity-75 ${
                isActive(item.href) ? "text-teak-brown underline underline-offset-8" : "text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-8 border-t border-sepia-border/60 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Utility</p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-10 items-center justify-start border border-sepia-border bg-paper-light px-3 text-sm uppercase tracking-[0.08em] text-ink transition hover:border-antique-brass"
          >
            Cart
          </button>
          {utilityLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-start border border-sepia-border bg-paper-light px-3 text-sm uppercase tracking-[0.08em] text-ink transition hover:border-antique-brass"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-1 grid grid-cols-3 gap-2">
            {['Contact', 'Favourites', 'Account'].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon"
                className="min-h-9 border border-sepia-border/60 bg-paper-light px-2 text-[10px] uppercase tracking-[0.1em] text-charcoal/55"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-sepia-border/60 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Editorial</p>
        <nav className="mt-3 grid gap-2">
          {editorialLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="inline-flex min-h-9 items-center text-base text-charcoal transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-8 text-xs text-charcoal/80">Cash on delivery across Myanmar.</p>
    </div>
  );
}
