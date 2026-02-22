import Link from "next/link";
import { useState } from "react";
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

const collectionLinks = [
  { href: "/#latest-products", label: "New In" },
  { href: "/search", label: "Search" },
];

const supportLinks = [
  { href: "/order/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

const policyLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/returns", label: "Returns & Exchange" },
];

export function HeaderNavPanel({
  menuId,
  isOpen,
  panelRef,
  currentPathname,
  onClose,
  onOpenCart,
}: HeaderNavPanelProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);

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
      className={`fixed left-0 top-0 z-[60] h-[100dvh] w-full max-w-none border-r border-sepia-border/60 bg-parchment p-5 text-ink opacity-0 sm:max-w-[min(40vw,420px)] sm:p-6 ${
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

      <div className="mt-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Browse</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setCollectionsOpen((value) => !value)}
            aria-expanded={collectionsOpen}
            aria-controls="browse-collections"
            className="inline-flex min-h-10 items-center justify-start text-2xl font-semibold leading-tight text-ink transition hover:opacity-75"
          >
            Collections
          </button>
          <nav
            id="browse-collections"
            className={`mt-2 overflow-hidden transition-[max-height,opacity] duration-200 ${
              collectionsOpen ? "max-h-52 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="grid gap-2 pl-3">
              {collectionLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`inline-flex min-h-9 items-center text-sm uppercase tracking-[0.08em] transition hover:text-teak-brown ${
                    isActive(item.href) ? "text-teak-brown" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Support</p>
        <div className="mt-4 grid gap-1.5">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-10 items-center justify-start text-sm uppercase tracking-[0.08em] text-ink transition hover:text-teak-brown"
          >
            Cart
          </button>
          {supportLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-start text-sm uppercase tracking-[0.08em] text-ink transition hover:text-teak-brown"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Policies</p>
        <nav className="mt-3 grid gap-1.5">
          {policyLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="inline-flex min-h-9 items-center text-sm uppercase tracking-[0.08em] text-charcoal transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/75">Coming Soon</p>
        <div className="mt-3 grid gap-1.5">
          {["Favourites", "Account"].map((item) => (
            <button
              key={item}
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="inline-flex min-h-9 items-center justify-start text-sm uppercase tracking-[0.08em] text-charcoal/55"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-12 text-xs text-charcoal/80">Cash on delivery across Myanmar.</p>
    </div>
  );
}
