"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWishlistStatus } from "@/features/storefront/wishlist/lib/wishlist-client";
import type { WishlistStatusItem } from "@/features/storefront/wishlist/types";

export function useWishlistStatus(productIds: string[]) {
  const stableProductIds = useMemo(
    () => Array.from(new Set(productIds.filter(Boolean))),
    [productIds],
  );
  const [statusByProductId, setStatusByProductId] = useState<Record<string, WishlistStatusItem>>({});

  useEffect(() => {
    let cancelled = false;

    if (stableProductIds.length === 0) {
      return;
    }

    void fetchWishlistStatus(stableProductIds)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setStatusByProductId(
          result.items.reduce<Record<string, WishlistStatusItem>>((acc, item) => {
            acc[item.productId] = item;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setStatusByProductId({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableProductIds]);

  function setProductWishlistStatus(productId: string, status: WishlistStatusItem) {
    setStatusByProductId((current) => ({
      ...current,
      [productId]: status,
    }));
  }

  return {
    statusByProductId: stableProductIds.length === 0 ? {} : statusByProductId,
    setProductWishlistStatus,
  };
}
