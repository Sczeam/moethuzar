import Link from "next/link";
import ProductListEmptyState from "@/components/storefront/product-list-empty-state";
import ProductListErrorState from "@/components/storefront/product-list-error-state";
import ProductCard from "@/features/storefront/home/components/product-card";
import type { StorefrontHomeData } from "@/features/storefront/home/types";

type LatestProductsSectionProps = {
  data: StorefrontHomeData;
};

export default function LatestProductsSection({
  data,
}: LatestProductsSectionProps) {
  function pageHref(page: number) {
    return `/?page=${page}#latest-products`;
  }

  return (
    <section
      id="latest-products"
      className="mx-auto w-full max-w-450 px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-5">
        <h2 className="text-6xl font-bold uppercase tracking-[0.03em] text-ink">
          Our Product
        </h2>
      </div>

      {data.hasLoadError ? (
        <ProductListErrorState />
      ) : data.products.length === 0 ? (
        <ProductListEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 border-sepia-border md:gap-0 md:border sm:grid-cols-2 lg:grid-cols-3">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.pagination.totalPages > 1 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link
                href={pageHref(Math.max(1, data.pagination.page - 1))}
                className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                  data.pagination.page === 1
                    ? "pointer-events-none border-sepia-border text-charcoal/50"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-light"
                }`}
              >
                Prev
              </Link>

              {Array.from(
                { length: data.pagination.totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <Link
                  key={page}
                  href={pageHref(page)}
                  className={`border px-3 py-1 text-xs font-semibold ${
                    page === data.pagination.page
                      ? "border-ink bg-ink text-paper-light"
                      : "border-sepia-border text-ink hover:border-ink"
                  }`}
                >
                  {page}
                </Link>
              ))}

              <Link
                href={pageHref(
                  Math.min(data.pagination.totalPages, data.pagination.page + 1)
                )}
                className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                  data.pagination.page === data.pagination.totalPages
                    ? "pointer-events-none border-sepia-border text-charcoal/50"
                    : "border-ink text-ink hover:bg-ink hover:text-paper-light"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
