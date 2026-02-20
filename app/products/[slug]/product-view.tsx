"use client";

import gsap from "gsap";
import { IconClose } from "@/components/layout/header/icons";
import { formatMoney } from "@/lib/format";
import { NAV_MENU_ANIMATION } from "@/lib/animations/nav-menu";
import { buildProductGalleryImages } from "@/lib/storefront/product-gallery";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Variant = {
  id: string;
  sku: string;
  name: string;
  color: string | null;
  size: string | null;
  price: string | null;
  inventory: number;
};

type ProductViewProps = {
  product: {
    id: string;
    name: string;
    description: string | null;
    currency: string;
    basePrice: string;
    images: {
      id: string;
      url: string;
      alt: string | null;
      variantId: string | null;
    }[];
    variants: Variant[];
  };
};

type AddToCartStatus =
  | { tone: "success"; text: string }
  | { tone: "error"; text: string }
  | null;

export default function ProductView({ product }: ProductViewProps) {
  const firstInStockVariant = useMemo(
    () =>
      product.variants.find((variant) => variant.inventory > 0) ??
      product.variants[0] ??
      null,
    [product.variants],
  );

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .map((variant) => variant.color)
            .filter((color): color is string => Boolean(color)),
        ),
      ),
    [product.variants],
  );

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants
            .map((variant) => variant.size)
            .filter((size): size is string => Boolean(size)),
        ),
      ),
    [product.variants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(
    firstInStockVariant?.color ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [status, setStatus] = useState<AddToCartStatus>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openInfoPanel, setOpenInfoPanel] = useState<"details" | "shipping" | null>(null);
  const infoOverlayRef = useRef<HTMLButtonElement | null>(null);
  const infoMobilePanelRef = useRef<HTMLDivElement | null>(null);
  const infoDesktopPanelRef = useRef<HTMLDivElement | null>(null);

  const selectedVariant = useMemo(() => {
    const exact = product.variants.find((variant) => {
      const colorMatch = selectedColor ? variant.color === selectedColor : true;
      const sizeMatch = selectedSize ? variant.size === selectedSize : true;
      return colorMatch && sizeMatch;
    });

    if (exact) {
      return exact;
    }

    const fallback = product.variants.find((variant) => {
      const colorMatch = selectedColor ? variant.color === selectedColor : true;
      const sizeMatch = selectedSize ? variant.size === selectedSize : true;
      return colorMatch && sizeMatch && variant.inventory > 0;
    });

    return fallback ?? firstInStockVariant;
  }, [firstInStockVariant, product.variants, selectedColor, selectedSize]);

  const isColorAvailable = useMemo(() => {
    return (color: string) =>
      product.variants.some((variant) => {
        const colorMatch = variant.color === color;
        const sizeMatch = selectedSize ? variant.size === selectedSize : true;
        return colorMatch && sizeMatch && variant.inventory > 0;
      });
  }, [product.variants, selectedSize]);

  const isSizeAvailable = useMemo(() => {
    return (size: string) =>
      product.variants.some((variant) => {
        const sizeMatch = variant.size === size;
        const colorMatch = selectedColor
          ? variant.color === selectedColor
          : true;
        return sizeMatch && colorMatch && variant.inventory > 0;
      });
  }, [product.variants, selectedColor]);

  const unitPrice = selectedVariant?.price ?? product.basePrice;
  const isOutOfStock = !selectedVariant || selectedVariant.inventory <= 0;
  const requiresSizeSelection = sizes.length > 0 && !selectedSize;

  const galleryImages = useMemo(() => {
    return buildProductGalleryImages(
      product.images,
      selectedVariant?.id ?? null,
    );
  }, [product.images, selectedVariant]);

  const getColorSwatchClass = (color: string) => {
    const normalized = color.toLowerCase();

    if (normalized.includes("black")) return "bg-[#1f1f1f]";
    if (normalized.includes("white") || normalized.includes("cream"))
      return "bg-[#ece6da]";
    if (normalized.includes("yellow") || normalized.includes("gold"))
      return "bg-[#d7b55a]";
    if (normalized.includes("pink") || normalized.includes("rose"))
      return "bg-[#d68a97]";
    if (normalized.includes("navy")) return "bg-[#2e3f5a]";
    if (normalized.includes("blue")) return "bg-[#4e6f92]";
    if (normalized.includes("red") || normalized.includes("maroon"))
      return "bg-[#7a2e2a]";
    if (normalized.includes("green")) return "bg-[#4e5f45]";
    if (normalized.includes("brown")) return "bg-[#6b4b2a]";
    if (normalized.includes("gray") || normalized.includes("grey"))
      return "bg-[#7d7a73]";

    return "bg-[#3b332b]";
  };

  async function handleAddToCart() {
    if (requiresSizeSelection) {
      setStatus({ tone: "error", text: "Please select a size." });
      return;
    }

    if (!selectedVariant) {
      setStatus({ tone: "error", text: "Please select a color and size." });
      return;
    }

    if (selectedVariant.inventory <= 0) {
      setStatus({ tone: "error", text: "This variant is out of stock." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: 1,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatus({
          tone: "error",
          text: data.error ?? "Unable to add item to cart.",
        });
        return;
      }

      setStatus({ tone: "success", text: "Added to cart." });
      window.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { openDrawer: true },
        }),
      );
    } catch {
      setStatus({
        tone: "error",
        text: "Unexpected error while adding to cart.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", openInfoPanel !== null);
    return () => document.body.classList.remove("overflow-hidden");
  }, [openInfoPanel]);

  useEffect(() => {
    if (
      !infoOverlayRef.current ||
      !infoMobilePanelRef.current ||
      !infoDesktopPanelRef.current
    ) {
      return;
    }

    gsap.set(infoOverlayRef.current, { autoAlpha: 0, pointerEvents: "none" });
    gsap.set(infoMobilePanelRef.current, {
      y: 32,
      autoAlpha: 0,
      pointerEvents: "none",
    });
    gsap.set(infoDesktopPanelRef.current, {
      x: NAV_MENU_ANIMATION.drawer.closedXRight,
      autoAlpha: 0,
      pointerEvents: "none",
    });
  }, []);

  useEffect(() => {
    if (
      !infoOverlayRef.current ||
      !infoMobilePanelRef.current ||
      !infoDesktopPanelRef.current
    ) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const activePanel = isMobile
      ? infoMobilePanelRef.current
      : infoDesktopPanelRef.current;
    const inactivePanel = isMobile
      ? infoDesktopPanelRef.current
      : infoMobilePanelRef.current;

    gsap.killTweensOf([
      infoOverlayRef.current,
      infoMobilePanelRef.current,
      infoDesktopPanelRef.current,
    ]);

    const durationScale = reduceMotion ? 0 : 1;
    const overlayDuration = NAV_MENU_ANIMATION.overlay.duration * durationScale;
    const openDuration = NAV_MENU_ANIMATION.drawer.durationOpen * 1.2 * durationScale;
    const closeDuration =
      NAV_MENU_ANIMATION.drawer.durationClose * 1.15 * durationScale;

    gsap.set(inactivePanel, {
      autoAlpha: 0,
      pointerEvents: "none",
      ...(isMobile ? { x: NAV_MENU_ANIMATION.drawer.closedXRight, y: 0 } : { y: 32, x: 0 }),
    });

    if (openInfoPanel) {
      gsap.to(infoOverlayRef.current, {
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: overlayDuration,
        ease: NAV_MENU_ANIMATION.overlay.easeOut,
      });

      gsap.to(activePanel, {
        x: 0,
        y: 0,
        autoAlpha: 1,
        pointerEvents: "auto",
        duration: openDuration,
        ease: NAV_MENU_ANIMATION.drawer.easeOut,
      });
      return;
    }

    gsap.to(activePanel, {
      ...(isMobile ? { y: 32 } : { x: NAV_MENU_ANIMATION.drawer.closedXRight }),
      autoAlpha: 0,
      pointerEvents: "none",
      duration: closeDuration,
      ease: NAV_MENU_ANIMATION.drawer.easeIn,
    });

    gsap.to(infoOverlayRef.current, {
      autoAlpha: 0,
      pointerEvents: "none",
      duration: overlayDuration,
      ease: NAV_MENU_ANIMATION.overlay.easeIn,
    });
  }, [openInfoPanel]);

  useEffect(() => {
    const activePanel = window.matchMedia("(max-width: 639px)").matches
      ? infoMobilePanelRef.current
      : infoDesktopPanelRef.current;

    if (!openInfoPanel || !activePanel) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = activePanel.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    focusable[0]?.focus();

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenInfoPanel(null);
      }
    };

    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      previouslyFocused?.focus();
    };
  }, [openInfoPanel]);

  const panelTitle =
    openInfoPanel === "shipping" ? "Shipping and returns" : "Product details";

  const panelBody = (
    <div className="overflow-y-auto px-5 py-4 text-sm leading-relaxed text-charcoal sm:px-6">
      {openInfoPanel === "shipping" ? (
        <p>
          Cash on delivery is available across Myanmar. Returns and exchanges are accepted
          according to our returns policy. For assistance, visit Returns or contact support.
        </p>
      ) : (
        <p>{product.description ?? "No additional product details yet."}</p>
      )}
    </div>
  );

  return (
    <main className="mx-auto w-full max-w-[1900px] px-0 pb-8">
      <Link
        href="/"
        className="mb-3 inline-block px-4 pt-4 text-xs uppercase tracking-[0.08em] text-charcoal underline sm:px-6 lg:px-8"
      >
        Back to products
      </Link>

      <div className="grid grid-cols-1 border-y border-sepia-border/70 lg:grid-cols-[minmax(0,1fr)_minmax(420px,48vw)]">
        <section className="relative bg-paper-light lg:border-r lg:border-sepia-border/70">
          {galleryImages.length > 0 ? (
            <div className={isOutOfStock ? "grayscale" : ""}>
              {galleryImages.map((image, index) => (
                <div
                  key={`${image.id}-${index}`}
                  className="relative min-h-[52vh] border-b border-sepia-border/40 sm:min-h-[65vh] lg:min-h-[calc(100vh-9rem)]"
                >
                  <Image
                    src={image.url}
                    alt={image.alt ?? product.name}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover object-top"
                  />
                </div>
              ))}
              {isOutOfStock ? (
                <span className="absolute left-4 top-4 z-10 border border-seal-wax bg-seal-wax px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-paper-light sm:left-6 sm:top-6">
                  Sold out
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[52vh] items-center justify-center text-sm text-charcoal sm:min-h-[65vh] lg:min-h-[calc(100vh-9rem)]">
              No image
            </div>
          )}
        </section>

        <section className="flex flex-col justify-center bg-parchment px-5 py-12 sm:px-8 sm:py-16 lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
          <div className="w-full">
            <div className="mx-auto max-w-[560px] space-y-2">
              <h1 className="text-[18px] font-extrabold leading-tight text-ink">
                {product.name}
              </h1>
              <p className="text-sm text-ink">
                {formatMoney(unitPrice, product.currency)}
              </p>
            </div>
          </div>

          <div className="mt-8 w-full">
            <div className="mx-auto max-w-[560px] space-y-6">
              {colors.length > 0 ? (
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-charcoal">
                    Color
                    {selectedColor ? `: ${selectedColor}` : ""}
                  </legend>
                  <div className="flex flex-wrap gap-2.5">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={!isColorAvailable(color)}
                        aria-pressed={selectedColor === color}
                        onClick={() => {
                          setSelectedColor(color);
                          setStatus(null);
                        }}
                        className={`h-8 w-8 rounded-full border transition ${
                          selectedColor === color
                            ? "border-ink ring-2 ring-ink/25"
                            : "border-sepia-border/90"
                        } ${
                          !isColorAvailable(color)
                            ? "cursor-not-allowed opacity-35"
                            : "hover:scale-[1.02]"
                        } ${getColorSwatchClass(color)}`}
                        aria-label={`Select color ${color}`}
                        aria-disabled={!isColorAvailable(color)}
                      />
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {sizes.length > 0 ? (
                <fieldset>
                  <legend className="sr-only">Size</legend>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_128px]">
                    <select
                      value={selectedSize ?? ""}
                      onChange={(event) => {
                        const nextSize = event.target.value || null;
                        setSelectedSize(nextSize);
                        setStatus(null);
                      }}
                      className="field-select min-h-11"
                    >
                      <option value="" disabled>
                        Select Size
                      </option>
                      {sizes.map((size) => (
                        <option
                          key={size}
                          value={size}
                          disabled={!isSizeAvailable(size)}
                        >
                          {size} {!isSizeAvailable(size) ? "(Sold out)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled
                      className="btn-secondary min-h-11 text-xs uppercase tracking-[0.08em] opacity-45"
                    >
                      Size guide
                    </button>
                  </div>
                </fieldset>
              ) : null}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSubmitting || isOutOfStock || requiresSizeSelection}
                className="min-h-12 w-full border border-ink bg-ink px-4 text-sm font-semibold uppercase tracking-[0.08em] text-paper-light transition disabled:opacity-60"
              >
                {isOutOfStock
                  ? "Out of stock"
                  : isSubmitting
                    ? "Adding..."
                    : "Add to shopping bag"}
              </button>

              {status ? (
                <p
                  className={`text-sm ${
                    status.tone === "success"
                      ? "text-charcoal"
                      : "text-seal-wax"
                  }`}
                  aria-live="polite"
                >
                  {status.text}
                </p>
              ) : null}

              <div className="space-y-2 text-sm text-charcoal">
                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-0 py-2 text-left"
                    onClick={() => setOpenInfoPanel("details")}
                  >
                    <span>Product details</span>
                    <span aria-hidden="true">+</span>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-0 py-2 text-left"
                    onClick={() => setOpenInfoPanel("shipping")}
                  >
                    <span>Shipping and returns</span>
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </div>

              <p className="pt-2 text-xs text-charcoal/80">
                By proceeding, you agree to our{" "}
                <Link href="/terms" className="underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </div>

      <button
        ref={infoOverlayRef}
        type="button"
        onClick={() => setOpenInfoPanel(null)}
        aria-label="Close info drawer"
        className="fixed inset-0 z-[65] bg-ink/45 opacity-0 pointer-events-none"
      />
      <div
        ref={infoMobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={panelTitle}
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[82dvh] w-screen overflow-hidden border-t border-sepia-border/70 bg-parchment text-ink opacity-0 pointer-events-none sm:hidden"
      >
        <div className="flex items-center justify-between border-b border-sepia-border/70 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-ink">
            {panelTitle}
          </h2>
          <button
            type="button"
            onClick={() => setOpenInfoPanel(null)}
            className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75"
            aria-label="Close info drawer"
          >
            <IconClose />
          </button>
        </div>
        {panelBody}
      </div>
      <div
        ref={infoDesktopPanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={panelTitle}
        className="fixed inset-y-0 right-0 top-0 z-[70] hidden h-[100dvh] w-full max-w-[min(40vw,460px)] overflow-hidden border-l border-sepia-border/70 bg-parchment text-ink opacity-0 pointer-events-none sm:block"
      >
        <div className="flex items-center justify-between border-b border-sepia-border/70 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-ink">{panelTitle}</h2>
          <button
            type="button"
            onClick={() => setOpenInfoPanel(null)}
            className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75"
            aria-label="Close info drawer"
          >
            <IconClose />
          </button>
        </div>
        {panelBody}
      </div>
    </main>
  );
}
