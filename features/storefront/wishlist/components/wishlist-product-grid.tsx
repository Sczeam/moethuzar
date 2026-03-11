"use client";

import ProductCard from "@/features/storefront/home/components/product-card";
import type { StorefrontProductCardData } from "@/features/storefront/home/lib/product-card-data";
import { useWishlistStatus } from "@/features/storefront/wishlist/hooks/use-wishlist-status";
import type { WishlistSourceSurface } from "@/features/storefront/wishlist/types";

type WishlistProductGridProps = {
  products: StorefrontProductCardData[];
  sourceSurface: WishlistSourceSurface;
  className?: string;
};

export function WishlistProductGrid({
  products,
  sourceSurface,
  className = "grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-0 lg:grid-cols-3 md:border md:border-sepia-border",
}: WishlistProductGridProps) {
  const { statusByProductId, setProductWishlistStatus } = useWishlistStatus(
    products.map((product) => product.id),
  );

  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          sourceSurface={sourceSurface}
          wishlistStatus={statusByProductId[product.id] ?? null}
          onWishlistStatusChange={(status) => setProductWishlistStatus(product.id, status)}
        />
      ))}
    </div>
  );
}
