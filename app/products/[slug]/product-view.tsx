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
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const firstInStockVariant = product.variants.find((variant) => variant.inventory > 0);
    return firstInStockVariant?.id ?? product.variants[0]?.id ?? "";
  });
  const [quantity, setQuantity] = useState(1);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const unitPrice = selectedVariant?.price ?? product.basePrice;
  const maxQuantity = selectedVariant?.inventory ? Math.max(1, selectedVariant.inventory) : 1;
  const isOutOfStock = !selectedVariant || selectedVariant.inventory <= 0;

  function handleVariantChange(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setStatusText("");
  }

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
    <main className="vintage-shell max-w-5xl">
      <Link href="/" className="mb-6 inline-block text-sm text-charcoal underline">
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="aspect-[4/5] overflow-hidden vintage-panel bg-parchment">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-charcoal">
                No image
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <h1 className="text-4xl font-semibold text-ink">{product.name}</h1>
          <p className="text-2xl font-semibold text-teak-brown">
            {formatMoney(unitPrice, product.currency)}
          </p>
          {product.description ? <p className="text-charcoal">{product.description}</p> : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Variant</label>
            {product.variants.length > 0 ? (
              <select
                className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-ink"
                value={selectedVariantId}
                onChange={(event) => handleVariantChange(event.target.value)}
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name}{" "}
                    {variant.inventory > 0
                      ? `(${variant.inventory} in stock)`
                      : "(Sold out)"}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm text-charcoal">
                No active variants are available for this product.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Quantity</label>
            <input
              type="number"
              min={1}
              max={maxQuantity}
              className="w-28 rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-ink"
              value={quantity}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                if (!Number.isFinite(nextValue)) {
                  return;
                }

                const nextQuantity = Math.min(Math.max(1, Math.trunc(nextValue)), maxQuantity);
                setQuantity(nextQuantity);
              }}
              disabled={isOutOfStock}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isSubmitting || isOutOfStock}
              className="btn-primary disabled:opacity-60"
            >
              {isOutOfStock ? "Out of Stock" : isSubmitting ? "Adding..." : "Add to Cart"}
            </button>
            <Link
              href="/cart"
              className="btn-secondary"
            >
              Go to Cart
            </Link>
          </div>

          {selectedVariant ? (
            <p className="text-sm text-charcoal">
              {selectedVariant.inventory > 0
                ? `${selectedVariant.inventory} units available`
                : "This variant is currently sold out."}
            </p>
          ) : null}

          {statusText ? <p className="text-sm text-charcoal">{statusText}</p> : null}
        </section>
      </div>
    </main>
  );
}
