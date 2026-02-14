"use client";

import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useMemo, useState } from "react";

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
    images: { id: string; url: string; alt: string | null }[];
    variants: Variant[];
  };
};

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
  const [selectedSize, setSelectedSize] = useState<string | null>(
    firstInStockVariant?.size ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const unitPrice = selectedVariant?.price ?? product.basePrice;
  const maxQuantity = selectedVariant?.inventory
    ? Math.max(1, selectedVariant.inventory)
    : 1;
  const isOutOfStock = !selectedVariant || selectedVariant.inventory <= 0;

  const galleryImages = useMemo(() => {
    if (product.images.length === 0) {
      return [];
    }

    if (product.images.length >= 4) {
      return product.images.slice(0, 6);
    }

    const repeated = [...product.images];
    while (repeated.length < 4) {
      repeated.push(product.images[repeated.length % product.images.length]);
    }

    return repeated;
  }, [product.images]);

  const getColorSwatchClass = (color: string) => {
    const normalized = color.toLowerCase();

    if (normalized.includes("black")) return "bg-[#1f1f1f]";
    if (normalized.includes("white") || normalized.includes("cream"))
      return "bg-[#ece6da]";
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
    if (!selectedVariant) {
      setStatusText("Please select a variant.");
      return;
    }

    if (selectedVariant.inventory <= 0) {
      setStatusText("This variant is out of stock.");
      return;
    }

    setIsSubmitting(true);
    setStatusText("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: Math.min(quantity, selectedVariant.inventory),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Unable to add item to cart.");
        return;
      }

      setStatusText("Added to cart.");
    } catch {
      setStatusText("Unexpected error while adding to cart.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-3 inline-block text-xs uppercase tracking-[0.08em] text-charcoal underline"
      >
        Back to products
      </Link>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
        <section className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {galleryImages.length > 0 ? (
            galleryImages.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className="aspect-[3/4] overflow-hidden border border-sepia-border/60 bg-paper-light"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center border border-sepia-border bg-paper-light text-sm text-charcoal">
              No image
            </div>
          )}
        </section>

        <section className="space-y-5 bg-paper-light/40 p-2">
          <div className="border-b border-sepia-border/80 pb-4">
            <h1 className="text-[2rem] font-semibold leading-tight text-ink">
              {product.name}
            </h1>
            <p className="text-[2rem] font-semibold text-ink">
              {formatMoney(unitPrice, product.currency)}
            </p>
          </div>

          {colors.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-charcoal">
                Color: {selectedColor ?? "-"}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setQuantity(1);
                      setStatusText("");
                    }}
                    className={`h-11 w-11 rounded-full border ${
                      selectedColor === color
                        ? "border-ink ring-2 ring-ink/25"
                        : "border-sepia-border/90"
                    } ${getColorSwatchClass(color)}`}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {sizes.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-charcoal">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setQuantity(1);
                      setStatusText("");
                    }}
                    className={`min-w-12 border px-3 py-2 text-sm font-semibold uppercase ${
                      selectedSize === size
                        ? "border-ink bg-ink text-paper-light"
                        : "border-sepia-border text-ink hover:border-ink"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-sepia-border/80 pt-4">
            <div className="flex items-stretch gap-2">
              <div className="h-12 w-[92px] border border-sepia-border bg-parchment px-3 py-1.5">
                <label className="block text-[8px] font-semibold uppercase tracking-[0.06em] text-charcoal">
                  Qty
                </label>
                <select
                  className="mt-0.5 w-full border-0 bg-transparent p-0 text-base leading-none text-ink outline-none"
                  value={quantity}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    if (!Number.isFinite(nextValue)) {
                      return;
                    }

                    const nextQuantity = Math.min(
                      Math.max(1, Math.trunc(nextValue)),
                      maxQuantity,
                    );
                    setQuantity(nextQuantity);
                  }}
                  disabled={isOutOfStock}
                >
                  {Array.from(
                    { length: maxQuantity },
                    (_, index) => index + 1,
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSubmitting || isOutOfStock}
                className="h-12 flex-1 border border-ink bg-ink px-4 text-sm font-semibold uppercase tracking-[0.1em] text-paper-light disabled:opacity-60"
              >
                {isOutOfStock
                  ? "Out of Stock"
                  : isSubmitting
                    ? "Adding..."
                    : "Add to Cart"}
              </button>
            </div>
          </div>

          {statusText ? (
            <p className="text-sm text-charcoal">{statusText}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
