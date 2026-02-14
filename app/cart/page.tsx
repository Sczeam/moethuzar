"use client";

import { formatMoney } from "@/lib/format";
import Link from "next/link";
import { useRef } from "react";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  variant: {
    id: string;
    name: string;
    sku: string;
    color: string | null;
    size: string | null;
    inventory: number;
    product: {
      slug: string;
      name: string;
      images: { id: string; url: string; alt: string | null }[];
    };
  };
};

type CartData = {
  id: string;
  currency: string;
  subtotalAmount: string;
  itemCount: number;
  items: CartItem[];
};

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyVariants, setBusyVariants] = useState<Record<string, boolean>>({});
  const requestVersionRef = useRef(0);

  function getUserFacingError(data: unknown, fallback: string) {
    if (!data || typeof data !== "object") {
      return fallback;
    }

    const errorData = data as { code?: string; error?: string };
    if (errorData.code === "INSUFFICIENT_STOCK") {
      return "Requested quantity is greater than available stock.";
    }

    if (errorData.code === "VARIANT_NOT_FOUND" || errorData.code === "VARIANT_UNAVAILABLE") {
      return "This variant is no longer available.";
    }

    return errorData.error ?? fallback;
  }

  async function loadCart() {
    const response = await fetch("/api/cart");
    const data = await response.json();
    if (response.ok && data.ok) {
      setCart(data.cart);
      setStatusText("");
    } else {
      setStatusText(data.error ?? "Failed to load cart.");
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await loadCart();
      setLoading(false);
    })();
  }, []);

  async function updateQuantity(variantId: string, quantity: number) {
    if (!cart || busyVariants[variantId]) {
      return;
    }

    const previousCart = cart;
    setBusyVariants((prev) => ({ ...prev, [variantId]: true }));

    const nextQuantity = Number.isFinite(quantity) ? Math.max(1, Math.min(20, quantity)) : 1;
    requestVersionRef.current += 1;
    const version = requestVersionRef.current;

    setCart({
      ...previousCart,
      items: previousCart.items.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              quantity: nextQuantity,
              lineTotal: (Number(item.unitPrice) * nextQuantity).toFixed(2),
            }
          : item
      ),
      subtotalAmount: previousCart.items
        .reduce((acc, item) => {
          if (item.variant.id === variantId) {
            return acc + Number(item.unitPrice) * nextQuantity;
          }
          return acc + Number(item.lineTotal);
        }, 0)
        .toFixed(2),
    });

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity: nextQuantity }),
      });
      const data = await response.json();
      if (response.ok && data.ok && version === requestVersionRef.current) {
        setCart(data.cart);
        setStatusText("");
      } else if (version === requestVersionRef.current) {
        setCart(previousCart);
        setStatusText(getUserFacingError(data, "Failed to update cart."));
      }
    } catch {
      setCart(previousCart);
      setStatusText("Unexpected error while updating cart.");
    } finally {
      setBusyVariants((prev) => ({ ...prev, [variantId]: false }));
    }
  }

  async function removeItem(variantId: string) {
    if (!cart || busyVariants[variantId]) {
      return;
    }

    const previousCart = cart;
    setBusyVariants((prev) => ({ ...prev, [variantId]: true }));

    const removed = previousCart.items.find((item) => item.variant.id === variantId);
    setCart({
      ...previousCart,
      items: previousCart.items.filter((item) => item.variant.id !== variantId),
      subtotalAmount: (
        Number(previousCart.subtotalAmount) - (removed ? Number(removed.lineTotal) : 0)
      ).toFixed(2),
      itemCount: previousCart.items
        .filter((item) => item.variant.id !== variantId)
        .reduce((acc, item) => acc + item.quantity, 0),
    });

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setCart(data.cart);
        setStatusText("");
      } else {
        setCart(previousCart);
        setStatusText(getUserFacingError(data, "Failed to remove item."));
      }
    } catch {
      setCart(previousCart);
      setStatusText("Unexpected error while removing item.");
    } finally {
      setBusyVariants((prev) => ({ ...prev, [variantId]: false }));
    }
  }

  const hasItems = useMemo(() => Boolean(cart && cart.items.length > 0), [cart]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900">Your Cart</h1>
        <Link href="/" className="text-sm text-zinc-600 underline">
          Continue shopping
        </Link>
      </div>

      {loading ? <p className="text-zinc-600">Loading cart...</p> : null}

      {!loading && !hasItems ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-zinc-600">
          Your cart is empty.
        </p>
      ) : null}

      {!loading && hasItems && cart ? (
        <div className="space-y-4">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-[96px_1fr_auto]"
            >
              <div className="h-24 w-24 overflow-hidden rounded-md bg-zinc-100">
                {item.variant.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.variant.product.images[0].url}
                    alt={item.variant.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div>
                <Link href={`/products/${item.variant.product.slug}`} className="font-semibold">
                  {item.variant.product.name}
                </Link>
                <p className="text-sm text-zinc-600">{item.variant.name}</p>
                <p className="text-sm text-zinc-600">
                  {formatMoney(item.unitPrice, cart.currency)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={item.quantity}
                  disabled={Boolean(busyVariants[item.variant.id])}
                  onChange={(event) =>
                    void updateQuantity(item.variant.id, Number(event.target.value))
                  }
                  className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
                <p className="text-sm font-semibold">
                  {formatMoney(item.lineTotal, cart.currency)}
                </p>
                <button
                  type="button"
                  disabled={Boolean(busyVariants[item.variant.id])}
                  onClick={() => void removeItem(item.variant.id)}
                  className="text-xs text-red-600 underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}

          <div className="flex items-center justify-between rounded-xl bg-zinc-100 p-4">
            <p className="font-medium">Subtotal</p>
            <p className="text-lg font-bold">{formatMoney(cart.subtotalAmount, cart.currency)}</p>
          </div>

          <div className="flex justify-end">
            <Link
              href="/checkout"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-zinc-700">{statusText}</p> : null}
    </main>
  );
}
