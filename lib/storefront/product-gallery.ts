export type ProductImageLike = {
  id: string;
  url: string;
  alt: string | null;
  variantId: string | null;
};

type BuildGalleryOptions = {
  minItems?: number;
  maxItems?: number;
};

export function buildProductGalleryImages(
  images: ProductImageLike[],
  selectedVariantId: string | null,
  options: BuildGalleryOptions = {}
) {
  const minItems = options.minItems ?? 4;
  const maxItems = options.maxItems ?? 6;

  if (images.length === 0) {
    return [];
  }

  const sourceImages = (() => {
    if (!selectedVariantId) {
      return images;
    }

    const mapped = images.filter((image) => image.variantId === selectedVariantId);
    if (mapped.length > 0) {
      return mapped;
    }

    const unassigned = images.filter((image) => image.variantId === null);
    if (unassigned.length > 0) {
      return unassigned;
    }

    return images;
  })();

  if (sourceImages.length >= minItems) {
    return sourceImages.slice(0, maxItems);
  }

  const repeated = [...sourceImages];
  while (repeated.length < minItems) {
    repeated.push(sourceImages[repeated.length % sourceImages.length]);
  }

  return repeated;
}
