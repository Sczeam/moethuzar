"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 6l-12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <path
        d="M3.5 5h2l1.6 9.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

type SiteHeaderProps = {
  onSearchOpen?: () => void;
};

export default function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) {
      return;
    }

    gsap.set(overlayRef.current, { autoAlpha: 0 });
    gsap.set(panelRef.current, { x: 32, autoAlpha: 0 });
    gsap.set(linkRefs.current, { x: 8, autoAlpha: 0 });
  }, []);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) {
      return;
    }

    if (open) {
      gsap.to(overlayRef.current, {
        autoAlpha: 1,
        duration: 0.2,
        ease: "power1.out",
      });
      gsap.to(panelRef.current, {
        x: 0,
        autoAlpha: 1,
        duration: 0.28,
        ease: "power2.out",
      });
      gsap.to(linkRefs.current, {
        x: 0,
        autoAlpha: 1,
        duration: 0.2,
        stagger: 0.04,
        delay: 0.06,
        ease: "power2.out",
      });
      return;
    }

    gsap.to(linkRefs.current, {
      x: 8,
      autoAlpha: 0,
      duration: 0.12,
      stagger: 0.02,
      ease: "power1.in",
    });
    gsap.to(panelRef.current, {
      x: 20,
      autoAlpha: 0,
      duration: 0.18,
      ease: "power1.in",
      delay: 0.03,
    });
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: 0.18,
      ease: "power1.in",
    });
  }, [open]);

  return (
    <>
      <aside className="fixed right-0 top-0 z-50 flex h-[170px] w-[64px] flex-col items-center border-l border-b border-sepia-border/70 bg-teak-brown text-paper-light sm:h-[190px] sm:w-[68px]">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-md text-paper-light transition hover:bg-paper-light/10 sm:mt-3 sm:h-[52px] sm:w-[52px]"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
        <button
          type="button"
          onClick={() => (onSearchOpen ? onSearchOpen() : setOpen(true))}
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

      <div className={`fixed inset-0 z-40 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          ref={overlayRef}
          type="button"
          onClick={() => setOpen(false)}
          className="absolute inset-0 bg-ink/45"
          aria-label="Close navigation menu"
        />

        <div
          ref={panelRef}
          className="absolute right-[64px] top-0 h-screen w-[min(90vw,420px)] border-l border-sepia-border/60 bg-teak-brown p-10 text-paper-light sm:right-[68px]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.22em] text-aged-gold">Moethuzar</p>
          </div>

          <nav className="mt-10 grid gap-4">
            {menuLinks.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                ref={(element) => {
                  linkRefs.current[index] = element;
                }}
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
    </>
  );
}
