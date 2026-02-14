import { logError } from "@/lib/observability";
import { listActiveProducts } from "@/server/services/product.service";
import type { StorefrontHomeData } from "@/features/storefront/home/types";

type HomePageDataOptions = {
  page: number;
  pageSize?: number;
};

export async function getHomePageData(
  options: HomePageDataOptions
): Promise<StorefrontHomeData> {
  const pageSize = options.pageSize ?? 6;

  try {
    const allProducts = await listActiveProducts();
    const total = allProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, options.page), totalPages);
    const start = (page - 1) * pageSize;
    const products = allProducts.slice(start, start + pageSize);

    return {
      products,
      hasLoadError: false,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  } catch {
    logError({
      event: "storefront.home_products_load_failed",
      route: "/",
    });
    return {
      products: [],
      hasLoadError: true,
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  }
}
