import { notFound } from "next/navigation";
import { getActiveProductBySlug } from "@/server/services/product.service";
import ProductView from "./product-view";

type ActiveProduct = NonNullable<Awaited<ReturnType<typeof getActiveProductBySlug>>>;
type ActiveProductImage = ActiveProduct["images"][number];
type ActiveProductVariant = ActiveProduct["variants"][number];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductView
      product={{
        id: product.id,
        name: product.name,
        description: product.description,
        currency: product.currency,
        basePrice: product.price.toString(),
        images: product.images.map((image: ActiveProductImage) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
        })),
        variants: product.variants.map((variant: ActiveProductVariant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          color: variant.color,
          size: variant.size,
          price: variant.price?.toString() ?? null,
          inventory: variant.inventory,
        })),
      }}
    />
  );
}
