export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type CatalogDraftImage = {
  id?: string;
  url: string;
  alt: string | null;
  variantId?: string | null;
  sortOrder: number;
};

export type CatalogDraftVariant = {
  id?: string;
  sku: string;
  name: string;
  color: string | null;
  size: string | null;
  material: string | null;
  price: string | null;
  compareAtPrice: string | null;
  inventory?: number;
  initialInventory?: number;
  isActive: boolean;
  sortOrder: number;
};

export type CatalogDraft = {
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  status: ProductStatus;
  categoryId: string;
  images: CatalogDraftImage[];
  variants: CatalogDraftVariant[];
};

export function createEmptyVariant(sortOrder: number): CatalogDraftVariant {
  return {
    sku: "",
    name: "",
    color: "",
    size: "",
    material: "",
    price: "",
    compareAtPrice: "",
    inventory: 0,
    initialInventory: 0,
    isActive: true,
    sortOrder,
  };
}

export function createInitialCatalogDraft(categoryId = ""): CatalogDraft {
  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    currency: "MMK",
    status: "DRAFT",
    categoryId,
    images: [{ url: "", alt: "", variantId: null, sortOrder: 0 }],
    variants: [createEmptyVariant(0)],
  };
}

export function slugifyCatalogValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
