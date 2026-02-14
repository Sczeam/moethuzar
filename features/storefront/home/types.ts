import type { listActiveProducts } from "@/server/services/product.service";

export type StorefrontProduct = Awaited<ReturnType<typeof listActiveProducts>>[number];

export type StorefrontHomeData = {
  products: StorefrontProduct[];
  hasLoadError: boolean;
};
