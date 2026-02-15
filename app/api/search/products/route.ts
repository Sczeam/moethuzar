import { NextResponse } from "next/server";
import { routeErrorResponse } from "@/lib/api/route-error";
import { searchProductsQuerySchema } from "@/lib/validation/search";
import { searchActiveProducts } from "@/server/services/product.service";

type SearchedProduct = Awaited<ReturnType<typeof searchActiveProducts>>["products"][number];
type SearchedProductVariant = SearchedProduct["variants"][number];

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchProductsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      color: searchParams.get("color") ?? undefined,
      size: searchParams.get("size") ?? undefined,
      inStock: searchParams.get("inStock") ?? undefined,
      minPrice: searchParams.get("minPrice") ?? undefined,
      maxPrice: searchParams.get("maxPrice") ?? undefined,
    });

    const result = await searchActiveProducts(query);

    return NextResponse.json(
      {
        ok: true,
        items: result.products.map((product: SearchedProduct) => ({
          ...product,
          price: toPriceString(product.price),
          variants: product.variants.map((variant: SearchedProductVariant) => ({
            ...variant,
            price: variant.price ? toPriceString(variant.price) : null,
            compareAtPrice: variant.compareAtPrice
              ? toPriceString(variant.compareAtPrice)
              : null,
          })),
        })),
        pagination: {
          page: result.page,
          pageSize: query.pageSize,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
        appliedFilters: {
          q: query.q,
          sort: query.sort,
          category: query.category ?? null,
          color: query.color ?? null,
          size: query.size ?? null,
          inStock: query.inStock ?? null,
          minPrice: query.minPrice ?? null,
          maxPrice: query.maxPrice ?? null,
        },
        facets: result.facets,
        timingMs: Date.now() - startedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    return routeErrorResponse(error, { request, route: "api/search/products#GET" });
  }
}
