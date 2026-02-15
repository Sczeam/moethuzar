import Link from "next/link";
import ProductCard from "@/features/storefront/home/components/product-card";
import { searchActiveProducts } from "@/server/services/product.service";
import { searchProductsQuerySchema } from "@/lib/validation/search";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    sort?: string;
    category?: string;
    color?: string;
    size?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = searchProductsQuerySchema.parse({
    q: params.q,
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    category: params.category,
    color: params.color,
    size: params.size,
    inStock: params.inStock,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  });

  const result = await searchActiveProducts(query);

  const previousPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);

  function pageHref(targetPage: number, overrides?: Partial<typeof query>) {
    const search = new URLSearchParams();
    const next = { ...query, ...overrides, page: targetPage };

    if (next.q) {
      search.set("q", next.q);
    }
    search.set("page", String(next.page));
    search.set("pageSize", String(next.pageSize));
    search.set("sort", next.sort);

    if (next.category) {
      search.set("category", next.category);
    }
    if (next.color) {
      search.set("color", next.color);
    }
    if (next.size) {
      search.set("size", next.size);
    }
    if (next.inStock !== undefined) {
      search.set("inStock", String(next.inStock));
    }
    if (next.minPrice !== undefined) {
      search.set("minPrice", String(next.minPrice));
    }
    if (next.maxPrice !== undefined) {
      search.set("maxPrice", String(next.maxPrice));
    }

    return `/search?${search.toString()}`;
  }

  return (
    <main className="vintage-shell max-w-[1760px]">
      <section className="vintage-panel p-5 sm:p-6">
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Search Products</h1>
        <form action="/search" method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="search-query" className="sr-only">
            Search products
          </label>
          <input
            id="search-query"
            name="q"
            defaultValue={query.q}
            placeholder="Search by name, category, color, size..."
            className="field-input"
          />
          <label htmlFor="search-sort" className="sr-only">
            Sort results
          </label>
          <select id="search-sort" name="sort" defaultValue={query.sort} className="field-select sm:max-w-44">
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={String(query.pageSize)} />
          <button type="submit" className="btn-primary sm:min-w-32">
            Search
          </button>
        </form>
      </section>

      {query.q ? (
        <section className="mt-8">
          <p className="mb-4 text-sm text-charcoal">
            {result.total} result{result.total === 1 ? "" : "s"} for
            {" "}
            <span className="font-semibold text-ink">&quot;{query.q}&quot;</span>
          </p>

          {result.products.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-0 lg:grid-cols-3 md:border md:border-sepia-border">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="vintage-panel border-dashed p-8">
              <p className="text-charcoal">No products matched your search.</p>
              <Link href="/" className="btn-secondary mt-4">
                Back to Home
              </Link>
            </div>
          )}

          {result.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-2">
              <Link
                href={pageHref(previousPage)}
                className={`btn-secondary ${result.page === 1 ? "pointer-events-none opacity-50" : ""}`}
              >
                Prev
              </Link>
              <p className="text-sm text-charcoal">
                Page {result.page} / {result.totalPages}
              </p>
              <Link
                href={pageHref(nextPage)}
                className={`btn-secondary ${result.page === result.totalPages ? "pointer-events-none opacity-50" : ""}`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 vintage-panel border-dashed p-8">
          <p className="text-charcoal">Enter a keyword to search products.</p>
        </section>
      )}
    </main>
  );
}
