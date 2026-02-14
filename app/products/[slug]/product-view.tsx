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
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const unitPrice = selectedVariant?.price ?? product.basePrice;

  async function handleAddToCart() {
    if (!selectedVariant) {
      setStatusText("Please select a variant.");
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
          quantity,
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
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-6 inline-block text-sm text-zinc-600 underline">
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-zinc-100">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No image
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <h1 className="text-3xl font-bold text-zinc-900">{product.name}</h1>
          <p className="text-2xl font-semibold text-zinc-900">
            {formatMoney(unitPrice, product.currency)}
          </p>
          {product.description ? <p className="text-zinc-700">{product.description}</p> : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Variant</label>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              value={selectedVariantId}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} ({variant.inventory} in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Quantity</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-28 rounded-md border border-zinc-300 px-3 py-2"
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Adding..." : "Add to Cart"}
            </button>
            <Link
              href="/cart"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
            >
              Go to Cart
            </Link>
          </div>

          {statusText ? <p className="text-sm text-zinc-700">{statusText}</p> : null}
        </section>
      </div>
    </main>
  );
}
