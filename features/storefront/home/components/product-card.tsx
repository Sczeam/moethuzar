"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatMoney } from "@/lib/format";

export type StorefrontProductCardData = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  basePrice: string;
  images: { id: string; url: string; alt: string | null; variantId: string | null }[];
  variants: {
    id: string;
    color: string | null;
    size: string | null;
    price: string | null;
    inventory: number;
    isActive: boolean;
  }[];
};

type ProductCardProps = {
  product: StorefrontProductCardData;
};

type ColorOption = {
  color: string;
  inStock: boolean;
  previewImageUrl: string | null;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getColorSwatchClass(color: string) {
  const normalized = color.toLowerCase();

  if (normalized.includes("black")) return "bg-[#1f1f1f]";
  if (normalized.includes("white") || normalized.includes("cream")) return "bg-[#ece6da]";
  if (normalized.includes("yellow") || normalized.includes("gold")) return "bg-[#d7b55a]";
  if (normalized.includes("pink") || normalized.includes("rose")) return "bg-[#d68a97]";
  if (normalized.includes("navy")) return "bg-[#2e3f5a]";
  if (normalized.includes("blue")) return "bg-[#4e6f92]";
  if (normalized.includes("red") || normalized.includes("maroon")) return "bg-[#7a2e2a]";
  if (normalized.includes("green")) return "bg-[#4e5f45]";
  if (normalized.includes("brown")) return "bg-[#6b4b2a]";
  if (normalized.includes("gray") || normalized.includes("grey")) return "bg-[#7d7a73]";

  return "bg-[#3b332b]";
}

function buildColorOptions(product: StorefrontProductCardData): ColorOption[] {
  const byColor = new Map<string, { variantIds: string[]; inStock: boolean }>();

  for (const variant of product.variants) {
    if (!variant.isActive || !variant.color) {
      continue;
    }

    const existing = byColor.get(variant.color) ?? { variantIds: [], inStock: false };
    existing.variantIds.push(variant.id);
    if (variant.inventory > 0) {
      existing.inStock = true;
    }
    byColor.set(variant.color, existing);
  }

  return Array.from(byColor.entries()).map(([color, value]) => {
    const previewImage = product.images.find(
      (image) => image.variantId && value.variantIds.includes(image.variantId),
    );

    return {
      color,
      inStock: value.inStock,
      previewImageUrl: previewImage?.url ?? null,
    };
  });
}

function getPriceLabel(product: StorefrontProductCardData) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const rawValues =
    activeVariants.length > 0
      ? activeVariants.map((variant) => toNumber(variant.price ?? product.basePrice))
      : [toNumber(product.basePrice)];

  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);

  if (min === max) {
    return formatMoney(min, product.currency);
  }

  return `${formatMoney(min, product.currency)} - ${formatMoney(max, product.currency)}`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();

  const activeVariants = useMemo(
    () => product.variants.filter((variant) => variant.isActive),
    [product.variants],
  );

  const colorOptions = useMemo(() => buildColorOptions(product), [product]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  const totalInventory = useMemo(
    () => activeVariants.reduce((sum, variant) => sum + Math.max(variant.inventory, 0), 0),
    [activeVariants],
  );

  const soldOut = activeVariants.length === 0 || totalInventory <= 0;
  const stockLabel = soldOut ? "Sold Out" : totalInventory <= 5 ? "Low Stock" : "In Stock";
  const stockClass = soldOut
    ? "bg-seal-wax text-paper-light"
    : totalInventory <= 5
      ? "bg-aged-gold/85 text-ink"
      : "bg-antique-brass/80 text-ink";

  const defaultCover = product.images[0]?.url ?? null;
  const defaultHover = product.images[1]?.url ?? null;

  const activeColor = hoverColor ?? selectedColor;
  const selectedColorOption = colorOptions.find((option) => option.color === activeColor);
  const selectedColorImage = selectedColorOption?.previewImageUrl ?? null;

  const cover = selectedColorImage ?? defaultCover;
  const hoverImage = selectedColorImage ? null : defaultHover;

  function openProduct() {
    if (soldOut) {
      return;
    }
    router.push(`/products/${product.slug}`);
  }

  return (
    <article
      role="link"
      aria-disabled={soldOut}
      aria-label={soldOut ? `${product.name} is sold out` : `Open ${product.name}`}
      tabIndex={soldOut ? -1 : 0}
      onClick={openProduct}
      onKeyDown={(event) => {
        if (soldOut) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct();
        }
      }}
      className={`group flex h-full flex-col overflow-hidden border border-sepia-border bg-paper-light transition ${
        soldOut ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:border-ink/60"
      }`}
    >
      <div className="relative aspect-[4/5] bg-parchment">
        <span className={`absolute left-2 top-2 z-20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${stockClass}`}>
          {stockLabel}
        </span>
        {cover ? (
          <>
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 motion-reduce:transition-none ${
                soldOut ? "grayscale" : "grayscale-[28%]"
              } ${hoverImage ? "group-hover:opacity-0" : ""}`}
            />
            {hoverImage ? (
              <Image
                src={hoverImage}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none ${
                  soldOut ? "grayscale" : "grayscale-[28%]"
                }`}
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-charcoal">No image</div>
        )}
      </div>

      <div className="mt-auto min-h-[98px] border-t border-sepia-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 pr-2 text-sm font-bold uppercase tracking-[0.06em] text-ink">
            {product.name}
          </h3>
          <span className="shrink-0 border border-ink bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-paper-light">
            {getPriceLabel(product)}
          </span>
        </div>

        <div className="mt-1.5 flex min-h-6 items-center gap-2">
          {colorOptions.slice(0, 6).map((option) => (
            <button
              key={option.color}
              type="button"
              data-color={option.color}
              data-has-variant-image={option.previewImageUrl ? "true" : "false"}
              disabled={soldOut || !option.inStock}
              aria-label={`Preview ${option.color}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedColor((current) => (current === option.color ? null : option.color));
              }}
              onMouseEnter={() => setHoverColor(option.color)}
              onMouseLeave={() => setHoverColor(null)}
              className={`h-5 w-5 border border-sepia-border/70 transition ${
                selectedColor === option.color ? "ring-1 ring-ink" : ""
              } ${!option.inStock ? "opacity-30" : ""} ${getColorSwatchClass(option.color)}`}
            />
          ))}
          {colorOptions.length > 6 ? (
            <span className="text-[10px] uppercase tracking-[0.08em] text-charcoal">
              +{colorOptions.length - 6}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
