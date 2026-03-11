"use client";

import { useCallback, useEffect, useState } from "react";
import {
  removeWishlistItem,
  saveWishlistItem,
} from "@/features/storefront/wishlist/lib/wishlist-client";
import type {
  WishlistSourceSurface,
  WishlistStatusItem,
} from "@/features/storefront/wishlist/types";

const EMPTY_STATUS: WishlistStatusItem = {
  productId: "",
  saved: false,
  wishlistItemId: null,
  preferredVariantId: null,
  preferredColorValue: null,
  preferredSizeValue: null,
  lastInteractedAt: null,
};

export function useWishlistToggle(input: {
  productId: string;
  initialStatus?: WishlistStatusItem | null;
  sourceSurface: WishlistSourceSurface;
  onStatusChange?: (status: WishlistStatusItem) => void;
}) {
  const { initialStatus, onStatusChange, productId, sourceSurface } = input;
  const [status, setStatus] = useState<WishlistStatusItem>(
    initialStatus ?? { ...EMPTY_STATUS, productId },
  );
  const [pending, setPending] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
      return;
    }

    setStatus({ ...EMPTY_STATUS, productId });
  }, [initialStatus, productId]);

  const toggle = useCallback(async (preferences?: {
    preferredVariantId?: string | null;
    preferredColorValue?: string | null;
    preferredSizeValue?: string | null;
  }) => {
    if (pending) {
      return;
    }

    setPending(true);
    setErrorText("");

    try {
      if (status.saved) {
        await removeWishlistItem(productId);
        const nextStatus: WishlistStatusItem = {
          productId,
          saved: false,
          wishlistItemId: null,
          preferredVariantId: null,
          preferredColorValue: null,
          preferredSizeValue: null,
          lastInteractedAt: null,
        };
        setStatus(nextStatus);
        onStatusChange?.(nextStatus);
        return;
      }

      const nextStatus = await saveWishlistItem({
        productId,
        preferredVariantId: preferences?.preferredVariantId ?? null,
        preferredColorValue: preferences?.preferredColorValue ?? null,
        preferredSizeValue: preferences?.preferredSizeValue ?? null,
        sourceSurface,
      });
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch {
      setErrorText("Unable to update favourites right now.");
    } finally {
      setPending(false);
    }
  }, [onStatusChange, pending, productId, sourceSurface, status.saved]);

  const replaceStatus = useCallback((nextStatus: WishlistStatusItem) => {
    setStatus(nextStatus);
  }, []);

  return {
    status,
    pending,
    errorText,
    toggle,
    replaceStatus,
  };
}
