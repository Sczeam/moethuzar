"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { siteContent } from "@/lib/constants/site-content";

export default function HomeHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const topNavRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set([topNavRef.current, titleRef.current, ctaRef.current], {
        autoAlpha: 0,
        y: 12,
      });
      gsap.set(imageRef.current, { autoAlpha: 0, y: 52 });

      const timeline = gsap.timeline({
        defaults: { ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
      });

      timeline
        .to(imageRef.current, { autoAlpha: 1, y: 0, duration: 0.72 })
        .to(topNavRef.current, { autoAlpha: 1, y: 0, duration: 0.34 }, "-=0.02")
        .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.42 }, "-=0.1")
        .to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.22");
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-b border-sepia-border/60">
      <div className="relative isolate min-h-[clamp(560px,84vh,820px)] overflow-hidden">
        <div ref={imageRef} className="absolute inset-0 bg-[#180c09]">
          <Image
            src={siteContent.heroImageUrl}
            alt="Moethuzar new-season collection"
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
            loading="eager"
            className="object-cover object-[72%_20%] sm:object-cover sm:object-[74%_20%] lg:object-top"
          />
          <div className="absolute inset-0 bg-black/30 lg:bg-black/18" />
        </div>

        <div className="absolute inset-0 z-2 bg-[linear-gradient(90deg,rgba(0,0,0,0.66)_0%,rgba(0,0,0,0.48)_42%,rgba(0,0,0,0.16)_100%)]" />
        <div className="absolute inset-0 z-2 bg-[radial-gradient(circle_at_22%_35%,rgba(122,46,42,0.22),transparent_56%)]" />

        <div
          ref={topNavRef}
          className="relative z-10 hidden h-11 items-center border-b border-paper-light/20 bg-seal-wax/90 px-6 lg:flex"
        >
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-center gap-10 text-sm font-semibold uppercase tracking-[0.08em] text-paper-light/95">
            <Link
              href="#latest-products"
              className="transition hover:text-paper-light"
            >
              New In
            </Link>
            <Link href="/search" className="transition hover:text-paper-light">
              Shop
            </Link>
            <Link
              href="/lookbook"
              className="transition hover:text-paper-light"
            >
              Discover
            </Link>
            <Link href="/search" className="transition hover:text-paper-light">
              Sale
            </Link>
          </nav>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[clamp(560px,84vh,820px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <h1
              ref={titleRef}
              className="mt-4 text-[clamp(2.4rem,6.4vw,5.2rem)] font-black uppercase leading-[0.96] tracking-[0.012em] text-[#c33d35]"
            >
              <span className="block">New Season</span>
              <span className="block">Favourites</span>
            </h1>

            <div ref={ctaRef} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#latest-products"
                className="inline-flex min-h-12 items-center bg-seal-wax px-6 text-base font-semibold uppercase tracking-[0.08em] text-paper-light transition hover:bg-[#8a3530] active:scale-[0.98]"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
