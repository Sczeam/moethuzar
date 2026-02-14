"use client";

import gsap from "gsap";
import { useEffect, useId, useRef, useState } from "react";
import { HeaderNavPanel } from "@/components/layout/header/nav-panel";
import { HeaderNavRail } from "@/components/layout/header/nav-rail";
import { NAV_MENU_ANIMATION } from "@/lib/animations/nav-menu";
import { SITE_NAV_ITEMS } from "@/lib/constants/site-navigation";

type SiteHeaderProps = {
  onSearchOpen?: () => void;
};

export default function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

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
      <HeaderNavRail
        isOpen={open}
        menuControlsId={menuId}
        onToggleMenu={() => setOpen((current) => !current)}
        onSearch={() => (onSearchOpen ? onSearchOpen() : setOpen(true))}
      />
      <HeaderNavPanel
        menuId={menuId}
        isOpen={open}
        panelRef={panelRef}
        overlayRef={overlayRef}
        linkRefs={linkRefs}
        items={SITE_NAV_ITEMS}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
