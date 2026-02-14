import Link from "next/link";
import ProductListEmptyState from "@/components/storefront/product-list-empty-state";
import ProductListErrorState from "@/components/storefront/product-list-error-state";
import ProductCard from "@/features/storefront/home/components/product-card";
import type { StorefrontHomeData } from "@/features/storefront/home/types";

type LatestProductsSectionProps = {
  data: StorefrontHomeData;
};

export default function LatestProductsSection({ data }: LatestProductsSectionProps) {
  return (
    <section id="latest-products" className="vintage-shell">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-4xl font-semibold text-ink">Latest Products</h2>
        <Link href="/cart" className="btn-secondary">
          View Cart
        </Link>
      </div>

      {data.hasLoadError ? (
        <ProductListErrorState />
      ) : data.products.length === 0 ? (
        <ProductListEmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
