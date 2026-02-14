import Link from "next/link";
import { IconCart, IconClose, IconMenu, IconSearch } from "./icons";

type HeaderNavRailProps = {
  isOpen: boolean;
  menuControlsId: string;
  onToggleMenu: () => void;
  onSearch: () => void;
};

export function HeaderNavRail({ isOpen, menuControlsId, onToggleMenu, onSearch }: HeaderNavRailProps) {
  return (
    <aside className="fixed right-0 top-0 z-50 flex h-[170px] w-[64px] flex-col items-center border-l border-b border-sepia-border/70 bg-teak-brown text-paper-light sm:h-[190px] sm:w-[68px]">
      <button
        type="button"
        onClick={onToggleMenu}
        className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-3 sm:h-[52px] sm:w-[52px]"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls={menuControlsId}
      >
        {isOpen ? <IconClose /> : <IconMenu />}
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-2 sm:h-[52px] sm:w-[52px]"
        aria-label="Open search"
      >
        <IconSearch />
      </button>
      <Link
        href="/cart"
        className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-2 sm:h-[52px] sm:w-[52px]"
        aria-label="Open cart"
      >
        <IconCart />
      </Link>
    </aside>
  );
}
