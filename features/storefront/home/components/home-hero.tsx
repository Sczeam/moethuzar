"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { siteContent } from "@/lib/constants/site-content";

export default function HomeHero() {
  const rootRef = useRef<HTMLElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const titlePrimaryRef = useRef<HTMLSpanElement | null>(null);
  const titleSecondaryRef = useRef<HTMLSpanElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const trustRef = useRef<HTMLParagraphElement | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(
        [
          eyebrowRef.current,
          titlePrimaryRef.current,
          titleSecondaryRef.current,
          bodyRef.current,
          ctaRef.current,
          trustRef.current,
        ],
        { autoAlpha: 0, y: 14 }
      );

      const timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
      });

      timeline
        .to(eyebrowRef.current, { autoAlpha: 1, y: 0, duration: 0.42 })
        .to(titlePrimaryRef.current, { autoAlpha: 1, y: 0, duration: 0.6 })
        .to(titleSecondaryRef.current, { autoAlpha: 1, y: 0, duration: 0.45 }, "-=0.35")
        .to(bodyRef.current, { autoAlpha: 1, y: 0, duration: 0.42 }, "-=0.2")
        .to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 0.42 }, "-=0.22");
      timeline.to(trustRef.current, { autoAlpha: 1, y: 0, duration: 0.35 }, "-=0.2");
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={rootRef} className="min-h-screen border-b border-sepia-border/60">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_500px]">
        <div className="relative flex min-h-[44vh] flex-col justify-between px-6 py-8 sm:min-h-[48vh] sm:px-10 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
          <div className="max-w-4xl">
            <p
              ref={eyebrowRef}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/80 sm:text-sm"
            >
              Myanmar ready-to-wear
            </p>
            <h1 className="mt-2 leading-[0.95] text-ink">
              <span
                ref={titlePrimaryRef}
                className="font-cooper-display block text-[clamp(2.4rem,6.6vw,5.6rem)] font-black uppercase tracking-[0.025em]"
              >
                MOETHUZAR
              </span>
              <span
                ref={titleSecondaryRef}
                className="mt-2 block text-[clamp(1.05rem,2.2vw,1.8rem)] font-semibold tracking-[0.08em]"
              >
                Ready to Wear
              </span>
            </h1>
          </div>

          <div className="mb-8 max-w-xl sm:mb-12">
            <p ref={bodyRef} className="text-lg leading-relaxed text-charcoal sm:text-xl">
              Grace in every wear. Designed for modern daily elegance with cash on delivery
              across Myanmar.
            </p>
            <div ref={ctaRef} className="mt-7 flex flex-wrap gap-3">
              <Link href="#latest-products" className="btn-primary">
                Shop New In
              </Link>
              <Link href="/search" className="btn-secondary">
                Search Catalog
              </Link>
            </div>
            <p
              ref={trustRef}
              className="mt-4 text-xs uppercase tracking-[0.1em] text-charcoal/85 sm:text-sm"
            >
              COD available • Myanmar-wide delivery • Timeless silhouettes
            </p>
          </div>
        </div>

        <div className="relative mx-4 mb-6 h-[52vh] border border-sepia-border/70 bg-paper-light sm:mx-6 sm:h-[56vh] lg:my-12 lg:ml-10 lg:mr-[50px] lg:h-[calc(100%-6rem)]">
          <Image
            src={siteContent.heroImageUrl}
            alt="Moethuzar hero"
            fill
            sizes="(max-width: 1024px) 92vw, 500px"
            priority
            fetchPriority="high"
            loading="eager"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-teak-brown/30 mix-blend-multiply" />
          <div className="absolute inset-0 border border-antique-brass/30" />
        </div>
      </div>
    </section>
  );
}
