"use client";

import Link from "next/link";
import { useState } from "react";

const menuLinks = [
  { href: "/", label: "Storefront" },
  { href: "/cart", label: "Cart" },
  { href: "/order/track", label: "Track Order" },
  { href: "/admin", label: "Admin Panel" },
];

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

type SiteHeaderProps = {
  onSearchOpen?: () => void;
};

export default function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed right-0 top-0 z-50 flex h-[170px] w-[64px] flex-col items-center border-l border-b border-sepia-border/70 bg-teak-brown text-paper-light sm:h-[190px] sm:w-[68px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-3 sm:h-[52px] sm:w-[52px]"
          aria-label="Open navigation menu"
        >
          <IconMenu />
        </button>
        <button
          type="button"
          onClick={() => (onSearchOpen ? onSearchOpen() : setOpen(true))}
          className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-2 sm:h-[52px] sm:w-[52px]"
          aria-label="Open search"
        >
          <IconSearch />
        </button>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/45"
            aria-label="Close navigation menu"
          />

          <div className="absolute right-[64px] top-0 h-screen w-[min(90vw,420px)] border-l border-sepia-border/60 bg-teak-brown p-10 text-paper-light sm:right-[68px]">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.22em] text-aged-gold">Moethuzar</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-2xl leading-none text-paper-light transition hover:bg-paper-light/10"
                aria-label="Close menu"
              >
                x
              </button>
            </div>

            <nav className="mt-10 grid gap-4">
              {menuLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-4xl font-semibold text-paper-light transition hover:text-aged-gold sm:text-5xl"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 border-t border-paper-light/30 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-aged-gold">Search</p>
              <p className="mt-2 text-sm text-paper-light/80">
                Use Track Order for order lookup. Product keyword search will be added in a later phase.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
