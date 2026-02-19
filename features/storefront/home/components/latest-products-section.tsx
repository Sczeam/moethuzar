import Link from "next/link";
import ProductListEmptyState from "@/components/storefront/product-list-empty-state";
import ProductListErrorState from "@/components/storefront/product-list-error-state";
import ProductCard from "@/features/storefront/home/components/product-card";
import {
  mapProductToCardData,
  type StorefrontProductCardData,
} from "@/features/storefront/home/lib/product-card-data";
import type { StorefrontHomeData } from "@/features/storefront/home/types";

type LatestProductsSectionProps = {
  data: StorefrontHomeData;
};

type PaginationToken = number | "ellipsis";

function buildPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

export default function LatestProductsSection({ data }: LatestProductsSectionProps) {
  const productsForCards: StorefrontProductCardData[] = data.products.map(mapProductToCardData);

  function pageHref(page: number) {
    return `/?page=${page}#latest-products`;
  }

  const paginationTokens = buildPaginationTokens(data.pagination.page, data.pagination.totalPages);
  const previousPage = Math.max(1, data.pagination.page - 1);
  const nextPage = Math.min(data.pagination.totalPages, data.pagination.page + 1);

  return (
    <section
      id="latest-products"
      className="mx-auto mt-4 w-full max-w-[1760px] px-4 py-10 sm:px-6 lg:px-8 rail-safe"
    >
      <div className="mb-6">
        <h2 className="text-[clamp(2.3rem,5vw,4.6rem)] font-bold uppercase leading-none tracking-[0.03em] text-ink">
          Our Product
        </h2>
      </div>

      {data.hasLoadError ? (
        <ProductListErrorState />
      ) : data.products.length === 0 ? (
        <ProductListEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-0 lg:grid-cols-3 md:border md:border-sepia-border">
            {productsForCards.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.pagination.totalPages > 1 ? (
            <>
              <div className="mt-6 flex items-center justify-between gap-3 sm:hidden">
                <Link
                  href={pageHref(previousPage)}
                  className={`btn-secondary min-w-24 ${
                    data.pagination.page === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Prev
                </Link>
                <p className="text-sm font-semibold text-charcoal">
                  Page {data.pagination.page} / {data.pagination.totalPages}
                </p>
                <Link
                  href={pageHref(nextPage)}
                  className={`btn-secondary min-w-24 ${
                    data.pagination.page === data.pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  Next
                </Link>
              </div>

              <div className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
                <Link
                  href={pageHref(previousPage)}
                  className={`btn-secondary ${
                    data.pagination.page === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Prev
                </Link>

                {paginationTokens.map((token, index) =>
                  token === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-sm text-charcoal/70">
                      ...
                    </span>
                  ) : (
                    <Link
                      key={token}
                      href={pageHref(token)}
                      className={`min-h-10 min-w-10 border px-3 text-center text-sm font-semibold ${
                        token === data.pagination.page
                          ? "border-ink bg-ink text-paper-light"
                          : "border-sepia-border bg-paper-light text-ink hover:border-ink"
                      }`}
                    >
                      {token}
                    </Link>
                  ),
                )}

                <Link
                  href={pageHref(nextPage)}
                  className={`btn-secondary ${
                    data.pagination.page === data.pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
