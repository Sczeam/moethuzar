"use client";

import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "@/components/layout/header/icons";
import { HeaderNavPanel } from "@/components/layout/header/nav-panel";
import { HeaderNavRail } from "@/components/layout/header/nav-rail";
import { NAV_MENU_ANIMATION } from "@/lib/animations/nav-menu";
import { SITE_NAV_ITEMS } from "@/lib/constants/site-navigation";

type SiteHeaderProps = {
  onSearchOpen?: () => void;
};

export default function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = "site-navigation-panel";
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemCount, setCartItemCount] = useState(0);
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const searchShellRef = useRef<HTMLFormElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const panelClosedX = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.panel.closedX;
    const linksClosedX = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.links.closedX;

    gsap.set(overlayRef.current, { autoAlpha: 0 });
    gsap.set(panelRef.current, { x: panelClosedX, autoAlpha: 0 });
    gsap.set(linkRefs.current, { x: linksClosedX, autoAlpha: 0 });
  }, []);

  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const durationMultiplier = prefersReducedMotion ? 0 : 1;
    const panelClosedX = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.panel.closedX;
    const linksClosedX = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.links.closedX;

    if (open) {
      gsap.to(overlayRef.current, {
        autoAlpha: 1,
        duration: NAV_MENU_ANIMATION.overlay.duration * durationMultiplier,
        ease: NAV_MENU_ANIMATION.overlay.easeOut,
      });
      gsap.to(panelRef.current, {
        x: NAV_MENU_ANIMATION.panel.openX,
        autoAlpha: 1,
        duration: NAV_MENU_ANIMATION.panel.durationOpen * durationMultiplier,
        ease: NAV_MENU_ANIMATION.panel.easeOut,
      });
      gsap.to(linkRefs.current, {
        x: NAV_MENU_ANIMATION.links.openX,
        autoAlpha: 1,
        duration: NAV_MENU_ANIMATION.links.durationOpen * durationMultiplier,
        stagger: NAV_MENU_ANIMATION.links.staggerOpen,
        delay: NAV_MENU_ANIMATION.links.delayOpen,
        ease: NAV_MENU_ANIMATION.links.easeOut,
      });
      return;
    }

    gsap.to(linkRefs.current, {
      x: linksClosedX,
      autoAlpha: 0,
      duration: NAV_MENU_ANIMATION.links.durationClose * durationMultiplier,
      stagger: NAV_MENU_ANIMATION.links.staggerClose,
      ease: NAV_MENU_ANIMATION.links.easeIn,
    });
    gsap.to(panelRef.current, {
      x: panelClosedX,
      autoAlpha: 0,
      duration: NAV_MENU_ANIMATION.panel.durationClose * durationMultiplier,
      ease: NAV_MENU_ANIMATION.panel.easeIn,
      delay: 0.03,
    });
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: NAV_MENU_ANIMATION.overlay.duration * durationMultiplier,
      ease: NAV_MENU_ANIMATION.overlay.easeIn,
    });
  }, [open]);

  useEffect(() => {
    let active = true;

    async function loadCartMeta() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const data = await response.json();
        if (!active) {
          return;
        }
        if (response.ok && data.ok && data.cart && typeof data.cart.itemCount === "number") {
          setCartItemCount(data.cart.itemCount);
          return;
        }
        setCartItemCount(0);
      } catch {
        if (active) {
          setCartItemCount(0);
        }
      }
    }

    void loadCartMeta();
    const onWindowFocus = () => void loadCartMeta();
    window.addEventListener("focus", onWindowFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [pathname]);

  useEffect(() => {
    if (!searchShellRef.current || !searchGlowRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.set(searchShellRef.current, {
      autoAlpha: 0,
      width: 88,
      borderRadius: 9999,
      y: -10,
      scale: 0.94,
      pointerEvents: "none",
    });
    gsap.set(searchGlowRef.current, {
      autoAlpha: 0,
      scale: 0.7,
    });

    if (prefersReducedMotion) {
      return;
    }
  }, []);

  useEffect(() => {
    if (!searchShellRef.current || !searchGlowRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionDuration = prefersReducedMotion ? 0 : 0.38;

    if (searchOpen) {
      gsap.to(searchShellRef.current, {
        autoAlpha: 1,
        width: 760,
        borderRadius: 18,
        y: 0,
        scale: 1,
        duration: motionDuration,
        ease: "power3.out",
        pointerEvents: "auto",
      });
      gsap.to(searchGlowRef.current, {
        autoAlpha: 0.45,
        scale: 1,
        duration: motionDuration,
        ease: "power2.out",
      });
      if (!prefersReducedMotion) {
        gsap.fromTo(
          searchShellRef.current,
          { y: -4 },
          { y: 0, duration: 0.25, ease: "power2.out" },
        );
      }
      searchInputRef.current?.focus();
      return;
    }

    gsap.to(searchGlowRef.current, {
      autoAlpha: 0,
      scale: 0.8,
      duration: motionDuration,
      ease: "power2.in",
    });
      gsap.to(searchShellRef.current, {
        autoAlpha: 0,
        width: 88,
        borderRadius: 9999,
        y: -10,
        scale: 0.94,
        duration: motionDuration,
        ease: "power2.inOut",
        pointerEvents: "none",
      });
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSearchOpen(false);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !searchShellRef.current) {
        return;
      }
      if (!searchShellRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const panelElement = panelRef.current;
    const focusableElements = panelElement.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );

    focusableElements[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previouslyFocusedElement?.focus();
    };
  }, [open]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[20vh] z-[55] hidden justify-center sm:flex">
        <div
          ref={searchGlowRef}
          aria-hidden
          className="pointer-events-none absolute -inset-3 rounded-[26px] bg-paper-light/45 blur-xl"
        />
        <form
          action="/search"
          method="get"
          ref={searchShellRef}
          className="pointer-events-auto relative flex h-16 w-[min(88vw,760px)] items-center border border-sepia-border/70 bg-paper-light/95 px-3 shadow-[0_14px_40px_rgba(37,30,24,0.24)] backdrop-blur-sm"
          onSubmit={(event) => {
            event.preventDefault();
            const normalized = searchQuery.trim();
            const href = normalized ? `/search?q=${encodeURIComponent(normalized)}` : "/search";
            setSearchOpen(false);
            router.push(href);
          }}
        >
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-teak-brown transition hover:text-ink"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          >
            <IconSearch />
          </button>
          <label htmlFor="floating-search-query" className="sr-only">
            Search products
          </label>
          <input
            id="floating-search-query"
            ref={searchInputRef}
            name="q"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search products..."
            className="ml-2 h-11 w-full border-0 bg-transparent px-1 text-lg text-ink placeholder:text-charcoal/75 focus:outline-none"
          />
        </form>
      </div>

      <HeaderNavRail
        isOpen={open}
        menuControlsId={menuId}
        cartItemCount={cartItemCount}
        onToggleMenu={() => {
          setSearchOpen(false);
          setOpen((current) => !current);
        }}
        onSearch={() => {
          if (onSearchOpen) {
            onSearchOpen();
            return;
          }

          setOpen(false);
          setSearchOpen((current) => !current);
        }}
      />
      <HeaderNavPanel
        menuId={menuId}
        isOpen={open}
        panelRef={panelRef}
        overlayRef={overlayRef}
        linkRefs={linkRefs}
        items={SITE_NAV_ITEMS}
        currentPathname={pathname}
        cartItemCount={cartItemCount}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
