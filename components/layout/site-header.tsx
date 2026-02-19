"use client";

import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconClose, IconSearch } from "@/components/layout/header/icons";
import { HeaderCartPanel } from "@/components/layout/header/cart-panel";
import { HeaderNavPanel } from "@/components/layout/header/nav-panel";
import { HeaderNavRail } from "@/components/layout/header/nav-rail";
import { NAV_MENU_ANIMATION } from "@/lib/animations/nav-menu";

type SiteHeaderProps = {
  onSearchOpen?: () => void;
};

type HeaderCartData = {
  currency: string;
  subtotalAmount: string;
  itemCount: number;
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: string;
    unitPrice: string;
    variant: {
      id: string;
      name: string;
      inventory: number;
      product: {
        slug: string;
        name: string;
        images: { id: string; url: string; alt: string | null }[];
      };
    };
  }>;
};

export default function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuId = "site-navigation-panel";
  const [activePanel, setActivePanel] = useState<"none" | "menu" | "cart">("none");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartData, setCartData] = useState<HeaderCartData | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartStatusText, setCartStatusText] = useState("");
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null);

  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const cartPanelRef = useRef<HTMLDivElement | null>(null);

  const searchShellRef = useRef<HTMLFormElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchGlowRef = useRef<HTMLDivElement | null>(null);

  const isDrawerOpen = activePanel !== "none";

  async function loadCartMeta() {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.ok && data.cart && typeof data.cart.itemCount === "number") {
        setCartItemCount(data.cart.itemCount);
      } else {
        setCartItemCount(0);
      }
    } catch {
      setCartItemCount(0);
    }
  }

  async function loadCartDetails() {
    setCartLoading(true);
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.ok && data.cart) {
        setCartData(data.cart as HeaderCartData);
        setCartItemCount(data.cart.itemCount ?? 0);
        setCartStatusText("");
      } else {
        setCartStatusText(data.error ?? "Failed to load cart.");
      }
    } catch {
      setCartStatusText("Failed to load cart.");
    } finally {
      setCartLoading(false);
    }
  }

  async function removeCartItem(variantId: string) {
    setBusyVariantId(variantId);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      const data = await response.json();
      if (response.ok && data.ok && data.cart) {
        setCartData(data.cart as HeaderCartData);
        setCartItemCount(data.cart.itemCount ?? 0);
        setCartStatusText("");
      } else {
        setCartStatusText(data.error ?? "Failed to remove item.");
      }
    } catch {
      setCartStatusText("Failed to remove item.");
    } finally {
      setBusyVariantId(null);
    }
  }

  useEffect(() => {
    void loadCartMeta();
  }, []);

  useEffect(() => {
    void loadCartMeta();
    setActivePanel("none");
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onWindowFocus = () => {
      void loadCartMeta();
      if (activePanel === "cart") {
        void loadCartDetails();
      }
    };

    window.addEventListener("focus", onWindowFocus);
    return () => window.removeEventListener("focus", onWindowFocus);
  }, [activePanel]);

  useEffect(() => {
    if (activePanel === "cart") {
      void loadCartDetails();
    }
  }, [activePanel]);

  useEffect(() => {
    if (!overlayRef.current || !menuPanelRef.current || !cartPanelRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const closedLeft = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.drawer.closedXLeft;
    const closedRight = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.drawer.closedXRight;

    gsap.set(overlayRef.current, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set(menuPanelRef.current, { x: closedLeft, autoAlpha: 0, pointerEvents: "none" });
    gsap.set(cartPanelRef.current, { x: closedRight, autoAlpha: 0, pointerEvents: "none" });
  }, []);

  useEffect(() => {
    if (!overlayRef.current || !menuPanelRef.current || !cartPanelRef.current) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const durationMultiplier = prefersReducedMotion ? 0 : 1;
    const closedLeft = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.drawer.closedXLeft;
    const closedRight = prefersReducedMotion ? 0 : NAV_MENU_ANIMATION.drawer.closedXRight;

    if (activePanel === "menu") {
      gsap.to(overlayRef.current, {
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: NAV_MENU_ANIMATION.overlay.duration * durationMultiplier,
        ease: NAV_MENU_ANIMATION.overlay.easeOut,
      });
      gsap.to(menuPanelRef.current, {
        x: NAV_MENU_ANIMATION.drawer.openX,
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: NAV_MENU_ANIMATION.drawer.durationOpen * durationMultiplier,
        ease: NAV_MENU_ANIMATION.drawer.easeOut,
      });
      gsap.to(cartPanelRef.current, {
        x: closedRight,
        autoAlpha: 0,
        pointerEvents: "none",
        duration: NAV_MENU_ANIMATION.drawer.durationClose * durationMultiplier,
        ease: NAV_MENU_ANIMATION.drawer.easeIn,
      });
      return;
    }

    if (activePanel === "cart") {
      gsap.to(overlayRef.current, {
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: NAV_MENU_ANIMATION.overlay.duration * durationMultiplier,
        ease: NAV_MENU_ANIMATION.overlay.easeOut,
      });
      gsap.to(cartPanelRef.current, {
        x: NAV_MENU_ANIMATION.drawer.openX,
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: NAV_MENU_ANIMATION.drawer.durationOpen * durationMultiplier,
        ease: NAV_MENU_ANIMATION.drawer.easeOut,
      });
      gsap.to(menuPanelRef.current, {
        x: closedLeft,
        autoAlpha: 0,
        pointerEvents: "none",
        duration: NAV_MENU_ANIMATION.drawer.durationClose * durationMultiplier,
        ease: NAV_MENU_ANIMATION.drawer.easeIn,
      });
      return;
    }

    gsap.to(menuPanelRef.current, {
      x: closedLeft,
      autoAlpha: 0,
      pointerEvents: "none",
      duration: NAV_MENU_ANIMATION.drawer.durationClose * durationMultiplier,
      ease: NAV_MENU_ANIMATION.drawer.easeIn,
    });
    gsap.to(cartPanelRef.current, {
      x: closedRight,
      autoAlpha: 0,
      pointerEvents: "none",
      duration: NAV_MENU_ANIMATION.drawer.durationClose * durationMultiplier,
      ease: NAV_MENU_ANIMATION.drawer.easeIn,
    });
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      pointerEvents: "none",
      duration: NAV_MENU_ANIMATION.overlay.duration * durationMultiplier,
      ease: NAV_MENU_ANIMATION.overlay.easeIn,
    });
  }, [activePanel]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const activeRef = activePanel === "menu" ? menuPanelRef : cartPanelRef;
    const panelElement = activeRef.current;
    if (!panelElement) {
      return;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const focusableElements = panelElement.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    focusableElements[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActivePanel("none");
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
  }, [activePanel, isDrawerOpen]);

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
    const motionDuration = prefersReducedMotion ? 0 : 0.28;

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

  return (
    <>
      <HeaderNavRail
        menuControlsId={menuId}
        isMenuOpen={activePanel === "menu"}
        cartItemCount={cartItemCount}
        onToggleMenu={() => {
          setSearchOpen(false);
          setActivePanel((current) => (current === "menu" ? "none" : "menu"));
        }}
        onOpenSearch={() => {
          if (onSearchOpen) {
            onSearchOpen();
            return;
          }

          setActivePanel("none");
          setSearchOpen((current) => !current);
        }}
        onOpenCart={() => {
          setSearchOpen(false);
          setActivePanel((current) => (current === "cart" ? "none" : "cart"));
        }}
      />

      <button
        ref={overlayRef}
        type="button"
        onClick={() => setActivePanel("none")}
        aria-label="Close drawer"
        className="fixed inset-0 z-[55] bg-ink/45"
      />

      <HeaderNavPanel
        menuId={menuId}
        isOpen={activePanel === "menu"}
        panelRef={menuPanelRef}
        currentPathname={pathname}
        onClose={() => setActivePanel("none")}
        onOpenCart={() => {
          setActivePanel("cart");
        }}
      />

      <HeaderCartPanel
        isOpen={activePanel === "cart"}
        panelRef={cartPanelRef}
        cart={cartData}
        loading={cartLoading}
        statusText={cartStatusText}
        busyVariantId={busyVariantId}
        onClose={() => setActivePanel("none")}
        onRemove={(variantId) => {
          void removeCartItem(variantId);
        }}
      />

      <div className="pointer-events-none fixed inset-x-0 top-[14vh] z-[65] flex justify-center px-4 sm:top-[18vh]">
        <div
          ref={searchGlowRef}
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[26px] bg-paper-light/45 blur-xl"
        />
        <form
          action="/search"
          method="get"
          ref={searchShellRef}
          className="pointer-events-auto relative flex h-14 w-[min(94vw,760px)] items-center border border-sepia-border/70 bg-paper-light/95 px-3 shadow-[0_14px_40px_rgba(37,30,24,0.24)] backdrop-blur-sm sm:h-16"
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
            <IconClose />
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
            className="ml-2 h-11 w-full border-0 bg-transparent px-1 text-base text-ink placeholder:text-charcoal/75 focus:outline-none sm:text-lg"
          />
          <button type="submit" aria-label="Submit search" className="inline-flex h-11 w-11 items-center justify-center text-teak-brown transition hover:text-ink">
            <IconSearch />
          </button>
        </form>
      </div>
    </>
  );
}
