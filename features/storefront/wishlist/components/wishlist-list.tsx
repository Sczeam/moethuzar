"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { WISHLIST_BADGE_LABELS } from "@/lib/constants/wishlist";
import { fetchWishlistPage, removeWishlistItem } from "@/features/storefront/wishlist/lib/wishlist-client";
import type { WishlistListItem } from "@/features/storefront/wishlist/types";
import { WishlistEmptyState } from "@/features/storefront/wishlist/components/wishlist-empty-state";

export function WishlistList({
  initialItems,
  initialNextCursor,
}: {
  initialItems: WishlistListItem[];
  initialNextCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setErrorText("");

    try {
      const payload = await fetchWishlistPage(nextCursor);
      setItems((current) => [...current, ...payload.items]);
      setNextCursor(payload.nextCursor);
    } catch {
      setErrorText("Unable to load more favourites right now.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function removeItem(productId: string) {
    if (busyProductId) {
      return;
    }

    setBusyProductId(productId);
    setErrorText("");

    try {
      await removeWishlistItem(productId);
      setItems((current) => current.filter((item) => item.productId !== productId));
    } catch {
      setErrorText("Unable to remove this favourite right now.");
    } finally {
      setBusyProductId(null);
    }
  }

  if (items.length === 0) {
    return <WishlistEmptyState />;
  }

  return (
    <section className="vintage-panel p-6 sm:p-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-charcoal/80">Account</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">My Favourites</h1>
          <p className="mt-2 text-sm text-charcoal">Saved styles are not reserved and may sell out.</p>
        </div>
        <span className="text-sm text-charcoal">{items.length} saved</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const badgeLabel = WISHLIST_BADGE_LABELS[item.badgeType];
          return (
            <article key={item.wishlistItemId} className="overflow-hidden border border-sepia-border bg-paper-light">
              <Link href={`/products/${item.slug}`} className="block">
                <div className="relative aspect-[4/5] bg-parchment">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.productName}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-charcoal">No image</div>
                  )}
                  {badgeLabel ? (
                    <span className="absolute left-3 top-3 border border-sepia-border bg-paper-light/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink">
                      {badgeLabel}
                    </span>
                  ) : null}
                </div>
              </Link>

              <div className="space-y-3 px-4 py-4">
                <div>
                  <Link href={`/products/${item.slug}`} className="text-base font-semibold text-ink hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-charcoal">
                    {formatMoney(item.currentPriceAmount, item.currency)}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-charcoal/85">
                  {item.preferredColorValue ? <p>Color: {item.preferredColorValue}</p> : null}
                  {item.preferredSizeValue ? <p>Size: {item.preferredSizeValue}</p> : null}
                </div>

                <div className="flex gap-3">
                  <Link href={`/products/${item.slug}`} className="btn-secondary">
                    View Product
                  </Link>
                  <button
                    type="button"
                    onClick={() => void removeItem(item.productId)}
                    disabled={busyProductId === item.productId}
                    className="btn-secondary disabled:opacity-60"
                  >
                    {busyProductId === item.productId ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {errorText ? <p className="mt-4 text-sm text-seal-wax">{errorText}</p> : null}

      {nextCursor ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="btn-primary disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
