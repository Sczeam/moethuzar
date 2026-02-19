import { formatMoney } from "@/lib/format";

export const PRODUCT_CARD_LOW_STOCK_THRESHOLD = 5;

export type StorefrontProductCardData = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  basePrice: string;
  images: { id: string; url: string; alt: string | null; variantId: string | null }[];
  variants: {
    id: string;
    color: string | null;
    size: string | null;
    price: string | null;
    inventory: number;
    isActive: boolean;
  }[];
};

type ProductCardSource = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  price: { toString(): string };
  images: {
    id: string;
    url: string;
    alt: string | null;
    variantId: string | null;
  }[];
  variants: {
    id: string;
    color: string | null;
    size: string | null;
    price: { toString(): string } | null;
    inventory: number;
    isActive: boolean;
  }[];
};

type StockState = {
  soldOut: boolean;
  totalInventory: number;
  stockLabel: "Sold Out" | "Low Stock" | "In Stock";
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapProductToCardData(product: ProductCardSource): StorefrontProductCardData {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    currency: product.currency,
    basePrice: product.price.toString(),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      variantId: image.variantId,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      color: variant.color,
      size: variant.size,
      price: variant.price ? variant.price.toString() : null,
      inventory: variant.inventory,
      isActive: variant.isActive,
    })),
  };
}

export function getProductCardActiveVariants(product: StorefrontProductCardData) {
  return product.variants.filter((variant) => variant.isActive);
}

export function getProductCardStockState(product: StorefrontProductCardData): StockState {
  const totalInventory = getProductCardActiveVariants(product).reduce(
    (sum, variant) => sum + Math.max(variant.inventory, 0),
    0,
  );

  const soldOut = totalInventory <= 0;
  const stockLabel = soldOut
    ? "Sold Out"
    : totalInventory <= PRODUCT_CARD_LOW_STOCK_THRESHOLD
      ? "Low Stock"
      : "In Stock";

  return {
    soldOut,
    totalInventory,
    stockLabel,
  };
}

export function getProductCardPriceLabel(product: StorefrontProductCardData) {
  const activeVariants = getProductCardActiveVariants(product);
  const rawValues =
    activeVariants.length > 0
      ? activeVariants.map((variant) => toNumber(variant.price ?? product.basePrice))
      : [toNumber(product.basePrice)];

  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);

  if (min === max) {
    return formatMoney(min, product.currency);
  }

  return `${formatMoney(min, product.currency)} - ${formatMoney(max, product.currency)}`;
}

export function getProductCardSizeSummary(product: StorefrontProductCardData) {
  const sizes = Array.from(
    new Set(
      getProductCardActiveVariants(product)
        .map((variant) => variant.size)
        .filter((size): size is string => Boolean(size)),
    ),
  );

  if (sizes.length === 0) {
    return null;
  }

  if (sizes.length <= 3) {
    return sizes.join(", ");
  }

  return `${sizes.slice(0, 3).join(", ")} +${sizes.length - 3}`;
}
