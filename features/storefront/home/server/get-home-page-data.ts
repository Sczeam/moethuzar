import { logError } from "@/lib/observability";
import { listActiveProducts } from "@/server/services/product.service";
import type { StorefrontHomeData } from "@/features/storefront/home/types";

export async function getHomePageData(): Promise<StorefrontHomeData> {
  try {
    const products = await listActiveProducts();
    return {
      products,
      hasLoadError: false,
    };
  } catch {
    logError({
      event: "storefront.home_products_load_failed",
      route: "/",
    });
    return {
      products: [],
      hasLoadError: true,
    };
  }
}
