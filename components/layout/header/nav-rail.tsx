import Link from "next/link";
import { IconCart, IconHeart, IconMenu, IconSearch, IconUser } from "./icons";

type HeaderNavRailProps = {
  menuControlsId: string;
  isMenuOpen: boolean;
  cartItemCount: number;
  onToggleMenu: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
};

export function HeaderNavRail({
  menuControlsId,
  isMenuOpen,
  cartItemCount,
  onToggleMenu,
  onOpenSearch,
  onOpenCart,
}: HeaderNavRailProps) {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-sepia-border/40 bg-parchment/95 backdrop-blur-sm sm:h-[72px]">
      <div className="relative mx-auto flex h-full max-w-[1760px] items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-3.5">
          <button
            type="button"
            onClick={onToggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls={menuControlsId}
            className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-brass"
          >
            <IconMenu />
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Open search"
            className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-brass"
          >
            <IconSearch />
          </button>
        </div>

        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            aria-label="Go to home"
            className="pointer-events-auto text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-xl sm:tracking-[0.12em]"
          >
            Moethuzar
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3.5">
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Contact us (coming soon)"
            title="Contact us (coming soon)"
            className="hidden min-h-11 min-w-11 items-center justify-center px-3 text-[11px] uppercase tracking-[0.1em] text-charcoal/55 sm:inline-flex"
          >
            Contact
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Favourites (coming soon)"
            title="Favourites (coming soon)"
            className="hidden h-11 w-11 items-center justify-center text-charcoal/55 sm:inline-flex"
          >
            <IconHeart />
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-label="Account (coming soon)"
            title="Account (coming soon)"
            className="hidden h-11 w-11 items-center justify-center text-charcoal/55 sm:inline-flex"
          >
            <IconUser />
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={
              cartItemCount > 0 ? `Open cart, ${cartItemCount} items` : "Open cart"
            }
            className="relative inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-antique-brass"
          >
            <IconCart />
            {cartItemCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-antique-brass px-1 text-[10px] font-semibold leading-none text-ink">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
