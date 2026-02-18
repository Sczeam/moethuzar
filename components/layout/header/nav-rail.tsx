import Link from "next/link";
import { IconCart, IconClose, IconMenu, IconSearch } from "./icons";

type HeaderNavRailProps = {
  isOpen: boolean;
  menuControlsId: string;
  onToggleMenu: () => void;
  onSearch: () => void;
  cartItemCount: number;
};

export function HeaderNavRail({
  isOpen,
  menuControlsId,
  onToggleMenu,
  onSearch,
  cartItemCount,
}: HeaderNavRailProps) {
  return (
    <aside className="fixed right-0 top-0 z-50 flex h-14 w-14 flex-col items-center border-l border-b border-sepia-border/70 bg-teak-brown text-paper-light sm:h-[176px] sm:w-16 lg:h-[190px] lg:w-[68px]">
      <button
        type="button"
        onClick={onToggleMenu}
        className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-none text-paper-light transition hover:bg-paper-light/10 active:scale-[0.98] focus-visible:bg-paper-light/15 sm:mt-2 sm:h-12 sm:w-12 lg:mt-3 lg:h-[52px] lg:w-[52px]"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls={menuControlsId}
        title={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <IconClose /> : <IconMenu />}
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="mt-0.5 hidden h-11 w-11 items-center justify-center rounded-none text-paper-light transition hover:bg-paper-light/10 active:scale-[0.98] focus-visible:bg-paper-light/15 sm:inline-flex sm:mt-1 sm:h-12 sm:w-12 lg:mt-2 lg:h-[52px] lg:w-[52px]"
        aria-label="Open search"
        title="Search"
      >
        <IconSearch />
      </button>
      <Link
        href="/cart"
        className="group relative mt-0.5 hidden h-11 w-11 items-center justify-center rounded-none text-paper-light transition hover:bg-paper-light/10 active:scale-[0.98] focus-visible:bg-paper-light/15 sm:inline-flex sm:mt-1 sm:h-12 sm:w-12 lg:mt-2 lg:h-[52px] lg:w-[52px]"
        aria-label="Open cart"
        title="Cart"
      >
        <IconCart />
        {cartItemCount > 0 ? (
          <span
            aria-label={`${cartItemCount} item${cartItemCount === 1 ? "" : "s"} in cart`}
            className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-aged-gold px-1 text-[10px] font-bold leading-none text-teak-brown ring-2 ring-teak-brown"
          >
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        ) : (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-aged-gold/70 ring-2 ring-teak-brown transition group-hover:scale-110"
          />
        )}
      </Link>
    </aside>
  );
}
