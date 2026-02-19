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
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);

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
          bodyRef.current,
          ctaRef.current,
        ],
        { autoAlpha: 0, y: 14 }
      );
      gsap.set(imageRef.current, { autoAlpha: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "cubic-bezier(0.22, 1, 0.36, 1)" },
      });

      timeline
        .to(
          [eyebrowRef.current, titlePrimaryRef.current, bodyRef.current, ctaRef.current],
          { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.06 }
        )
        .to(imageRef.current, { autoAlpha: 1, duration: 0.62 }, "-=0.28");
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-b border-sepia-border/60">
      <div className="mx-auto grid min-h-[clamp(560px,78vh,720px)] w-full max-w-[1280px] grid-cols-1 gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-center lg:gap-12 lg:px-8 xl:gap-16">
        <div className="relative flex min-h-[44vh] flex-col justify-center lg:min-h-0">
          <div className="max-w-[22ch]">
            <p
              ref={eyebrowRef}
              className="text-[12px] font-semibold uppercase tracking-[0.16em] text-charcoal/80"
            >
              DROP 01 · 2026
            </p>
            <h1 className="mt-3 text-ink">
              <span
                ref={titlePrimaryRef}
                className="font-cooper-display block text-[clamp(2.25rem,5.8vw,4rem)] font-black leading-[1.1]"
              >
                Simple silhouettes. Lasting impression.
              </span>
            </h1>
          </div>

          <div className="mt-5 max-w-[48ch] sm:mt-6">
            <p ref={bodyRef} className="text-[15px] leading-relaxed text-charcoal sm:text-[17px]">
              Made for movement, made for moments. Quietly elevated essentials.
            </p>
            <div ref={ctaRef} className="mt-6 flex flex-wrap gap-3.5">
              <Link href="#latest-products" className="btn-primary">
                Shop New In
              </Link>
              <Link
                href="/lookbook"
                className="btn-secondary transition-transform active:scale-[0.98] hover:underline hover:underline-offset-4"
              >
                View Lookbook
              </Link>
            </div>
          </div>
        </div>

        <div
          ref={imageRef}
          className="relative h-[52vh] overflow-hidden rounded-[18px] border border-sepia-border/70 bg-paper-light sm:h-[56vh] lg:h-[min(62vh,640px)]"
        >
          <Image
            src={siteContent.heroImageUrl}
            alt="Moethuzar hero"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
            fetchPriority="high"
            loading="eager"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-parchment/12" />
          <div className="absolute inset-0 border border-antique-brass/25" />
        </div>
      </div>
    </section>
  );
}
