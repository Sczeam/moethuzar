import Link from "next/link";
import ProductCard from "@/features/storefront/home/components/product-card";
import {
  mapProductToCardData,
  type StorefrontProductCardData,
} from "@/features/storefront/home/lib/product-card-data";
import { searchActiveProducts } from "@/server/services/product.service";
import {
  searchProductsQuerySchema,
  type SearchProductsQueryInput,
} from "@/lib/validation/search";

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

type PaginationToken = number | "ellipsis";
type SearchQueryState = SearchProductsQueryInput;
type ActiveFilterChip = {
  key: string;
  label: string;
  value: string;
  href: string;
};

function formatFacetLabel(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function optionValuesWithSelection(values: string[], selected?: string) {
  if (!selected) {
    return values;
  }
  const hasSelected = values.some((value) => value.toLowerCase() === selected.toLowerCase());
  if (hasSelected) {
    return values;
  }
  return [selected, ...values];
}

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query: SearchQueryState = searchProductsQuerySchema.parse({
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
  const productsForCards: StorefrontProductCardData[] = result.products.map(mapProductToCardData);

  const previousPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);
  const paginationTokens = buildPaginationTokens(result.page, result.totalPages);
  const normalizedQuery = query.q.trim();
  const hasAnyFilter =
    Boolean(query.category) ||
    Boolean(query.color) ||
    Boolean(query.size) ||
    query.inStock !== undefined ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined;
  const hasSearchIntent = normalizedQuery.length > 0 || hasAnyFilter;

  const categoryOptions = optionValuesWithSelection(
    result.facets.categories.map((item) => item.value),
    query.category,
  );
  const colorOptions = optionValuesWithSelection(
    result.facets.colors.map((item) => item.value),
    query.color,
  );
  const sizeOptions = optionValuesWithSelection(
    result.facets.sizes.map((item) => item.value),
    query.size,
  );

  function buildSearchHref(state: SearchQueryState) {
    const search = new URLSearchParams();

    if (state.q.trim()) {
      search.set("q", state.q.trim());
    }

    if (state.page > 1) {
      search.set("page", String(state.page));
    }
    if (state.pageSize !== 12) {
      search.set("pageSize", String(state.pageSize));
    }
    if (state.sort !== "relevance") {
      search.set("sort", state.sort);
    }

    if (state.category) {
      search.set("category", state.category);
    }
    if (state.color) {
      search.set("color", state.color);
    }
    if (state.size) {
      search.set("size", state.size);
    }
    if (state.inStock !== undefined) {
      search.set("inStock", String(state.inStock));
    }
    if (state.minPrice !== undefined) {
      search.set("minPrice", String(state.minPrice));
    }
    if (state.maxPrice !== undefined) {
      search.set("maxPrice", String(state.maxPrice));
    }

    const queryString = search.toString();
    return queryString ? `/search?${queryString}` : "/search";
  }

  function pageHref(targetPage: number) {
    return buildSearchHref({ ...query, page: targetPage });
  }

  function resetToFirstPageHref(overrides: Partial<SearchQueryState>) {
    return buildSearchHref({ ...query, ...overrides, page: 1 });
  }

  const activeFilterChips: ActiveFilterChip[] = [];
  if (query.category) {
    activeFilterChips.push({
      key: "category",
      label: "Category",
      value: formatFacetLabel(query.category),
      href: resetToFirstPageHref({ category: undefined }),
    });
  }
  if (query.color) {
    activeFilterChips.push({
      key: "color",
      label: "Color",
      value: query.color,
      href: resetToFirstPageHref({ color: undefined }),
    });
  }
  if (query.size) {
    activeFilterChips.push({
      key: "size",
      label: "Size",
      value: query.size,
      href: resetToFirstPageHref({ size: undefined }),
    });
  }
  if (query.inStock === true) {
    activeFilterChips.push({
      key: "inStock",
      label: "Stock",
      value: "In stock",
      href: resetToFirstPageHref({ inStock: undefined }),
    });
  }
  if (query.minPrice !== undefined) {
    activeFilterChips.push({
      key: "minPrice",
      label: "Min",
      value: `MMK ${query.minPrice.toLocaleString()}`,
      href: resetToFirstPageHref({ minPrice: undefined }),
    });
  }
  if (query.maxPrice !== undefined) {
    activeFilterChips.push({
      key: "maxPrice",
      label: "Max",
      value: `MMK ${query.maxPrice.toLocaleString()}`,
      href: resetToFirstPageHref({ maxPrice: undefined }),
    });
  }

  const clearFiltersHref = resetToFirstPageHref({
    category: undefined,
    color: undefined,
    size: undefined,
    inStock: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });
  const clearSearchHref = resetToFirstPageHref({
    q: "",
    category: undefined,
    color: undefined,
    size: undefined,
    inStock: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });

  return (
    <main className="vintage-shell max-w-[1760px]">
      <section className="vintage-panel p-5 sm:p-6">
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Search</h1>
        <p className="mt-2 text-sm text-charcoal sm:text-base">
          Find products by name, category, color, size, or price range.
        </p>
        <form action="/search" method="get" className="mt-5 space-y-4" aria-label="Product search filters">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="search-query" className="field-label">
                Keyword
              </label>
              <input
                id="search-query"
                name="q"
                defaultValue={query.q}
                placeholder="Search by name, category, color, size..."
                className="field-input mt-1"
              />
            </div>

            <div>
              <label htmlFor="search-sort" className="field-label">
                Sort
              </label>
              <select id="search-sort" name="sort" defaultValue={query.sort} className="field-select mt-1">
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="search-category" className="field-label">
                Category
              </label>
              <select
                id="search-category"
                name="category"
                defaultValue={query.category ?? ""}
                className="field-select mt-1"
              >
                <option value="">All categories</option>
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {formatFacetLabel(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="search-color" className="field-label">
                Color
              </label>
              <select id="search-color" name="color" defaultValue={query.color ?? ""} className="field-select mt-1">
                <option value="">All colors</option>
                {colorOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="search-size" className="field-label">
                Size
              </label>
              <select id="search-size" name="size" defaultValue={query.size ?? ""} className="field-select mt-1">
                <option value="">All sizes</option>
                {sizeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="search-min-price" className="field-label">
                Min price
              </label>
              <input
                id="search-min-price"
                name="minPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={query.minPrice ?? ""}
                className="field-input mt-1"
              />
            </div>

            <div>
              <label htmlFor="search-max-price" className="field-label">
                Max price
              </label>
              <input
                id="search-max-price"
                name="maxPrice"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={query.maxPrice ?? ""}
                className="field-input mt-1"
              />
            </div>

            <div className="flex items-end">
              <label
                htmlFor="search-in-stock"
                className="flex min-h-12 w-full cursor-pointer items-center gap-2 border border-sepia-border bg-paper-light px-3 py-2 text-sm text-charcoal"
              >
                <input
                  id="search-in-stock"
                  type="checkbox"
                  name="inStock"
                  value="true"
                  defaultChecked={query.inStock === true}
                  className="h-4 w-4 accent-antique-brass"
                />
                In stock only
              </label>
            </div>
          </div>

          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={String(query.pageSize)} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary min-w-32">
              Apply
            </button>
            <Link href={clearSearchHref} className="btn-secondary">
              Reset
            </Link>
          </div>
        </form>
      </section>

      {hasSearchIntent ? (
        <section className="mt-8 space-y-4">
          <div className="vintage-panel p-4 sm:p-5" aria-live="polite">
            <p className="text-xs uppercase tracking-[0.14em] text-charcoal/80">Search Results</p>
            <p className="mt-2 text-sm text-charcoal sm:text-base">
              {result.total} result{result.total === 1 ? "" : "s"}
              {normalizedQuery ? (
                <>
                  {" "}
                  for <span className="font-semibold text-ink">&quot;{normalizedQuery}&quot;</span>
                </>
              ) : (
                " from your selected filters"
              )}
            </p>
            <p className="mt-1 text-xs text-charcoal/80">
              Page {result.page} of {result.totalPages}
            </p>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="vintage-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.14em] text-charcoal/80">Active Filters</p>
                <Link href={clearFiltersHref} className="text-xs font-semibold uppercase tracking-[0.12em] text-ink underline">
                  Clear all
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <Link
                    key={chip.key}
                    href={chip.href}
                    className="inline-flex items-center gap-2 border border-sepia-border bg-paper-light px-3 py-1 text-sm text-ink transition hover:border-ink"
                    aria-label={`Remove ${chip.label} filter ${chip.value}`}
                  >
                    <span className="text-charcoal">{chip.label}:</span>
                    <span className="font-semibold">{chip.value}</span>
                    <span aria-hidden="true">×</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {result.products.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-0 lg:grid-cols-3 md:border md:border-sepia-border">
              {productsForCards.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="vintage-panel border-dashed p-8">
              <h2 className="text-xl font-semibold text-ink">No products found</h2>
              <p className="mt-2 text-charcoal">
                We could not match your current search. Try removing one or more filters.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {activeFilterChips.length > 0 ? <Link href={clearFiltersHref} className="btn-secondary">Clear Filters</Link> : null}
                {normalizedQuery ? <Link href={resetToFirstPageHref({ q: "" })} className="btn-secondary">Clear Keyword</Link> : null}
                <Link href="/#latest-products" className="btn-primary">
                  Browse New In
                </Link>
              </div>
            </div>
          )}

          {result.totalPages > 1 ? (
            <>
              <div className="mt-6 flex items-center justify-between gap-3 sm:hidden">
                <Link
                  href={pageHref(previousPage)}
                  className={`btn-secondary min-w-24 ${
                    result.page === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Prev
                </Link>
                <p className="text-sm font-semibold text-charcoal">
                  Page {result.page} / {result.totalPages}
                </p>
                <Link
                  href={pageHref(nextPage)}
                  className={`btn-secondary min-w-24 ${
                    result.page === result.totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Next
                </Link>
              </div>

              <div className="mt-6 hidden flex-wrap items-center gap-2 sm:flex">
                <Link
                  href={pageHref(previousPage)}
                  className={`btn-secondary ${result.page === 1 ? "pointer-events-none opacity-50" : ""}`}
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
                        token === result.page
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
                    result.page === result.totalPages ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  Next
                </Link>
              </div>
            </>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 vintage-panel border-dashed p-8">
          <h2 className="text-lg font-semibold text-ink">Start your search</h2>
          <p className="mt-2 text-charcoal">Enter a keyword or choose filters to find products.</p>
          <Link href="/#latest-products" className="btn-primary mt-4">
            Browse New In
          </Link>
        </section>
      )}
    </main>
  );
}
