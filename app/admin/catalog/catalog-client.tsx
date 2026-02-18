"use client";

import { buildVariantDiagnostics, toSkuToken } from "@/lib/admin/variant-editor";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

type ProductImageItem = {
  id?: string;
  url: string;
  alt: string | null;
  variantId?: string | null;
  sortOrder: number;
};

type ProductVariantItem = {
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

type VariantMatrixRow = {
  key: string;
  sku: string;
  name: string;
  color: string;
  size: string;
  material: string | null;
  price: string | null;
  compareAtPrice: string | null;
  initialInventory: number;
  isActive: boolean;
  exists: boolean;
};

type VariantPreset = {
  id: string;
  name: string;
  namePrefix: string;
  skuPrefix: string;
  material: string;
  colors: string[];
  sizes: string[];
};

type ProductItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  currency: string;
  status: ProductStatus;
  totalInventory: number;
  category: CategoryItem;
  images: ProductImageItem[];
  variants: ProductVariantItem[];
};

type ProductDraft = {
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  status: ProductStatus;
  categoryId: string;
  images: ProductImageItem[];
  variants: ProductVariantItem[];
};

type DraftSetter = (updater: (prev: ProductDraft) => ProductDraft) => void;

const statusOptions: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const editorSteps = ["BASICS", "IMAGES", "VARIANTS", "REVIEW"] as const;
type EditorStep = (typeof editorSteps)[number];

function editorStepLabel(step: EditorStep): string {
  if (step === "BASICS") return "Basics";
  if (step === "IMAGES") return "Images";
  if (step === "VARIANTS") return "Variants";
  return "Review";
}

function makeEmptyVariant(sortOrder: number): ProductVariantItem {
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

function makeInitialDraft(categoryId = ""): ProductDraft {
  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    currency: "MMK",
    status: "DRAFT",
    categoryId,
    images: [{ url: "", alt: "", variantId: null, sortOrder: 0 }],
    variants: [makeEmptyVariant(0)],
  };
}

function statusBadge(status: ProductStatus): string {
  if (status === "ACTIVE") {
    return "bg-antique-brass/20 text-teak-brown";
  }

  if (status === "ARCHIVED") {
    return "bg-charcoal/15 text-charcoal";
  }

  return "bg-paper-light text-charcoal";
}

function toInt(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseListInput(value: string): string[] {
  const parts = value.split(/[,\n]/g).map((item) => item.trim()).filter(Boolean);
  return [...new Set(parts.map((item) => item.toLowerCase()))].map((lower) => {
    const found = parts.find((item) => item.toLowerCase() === lower);
    return found ?? lower;
  });
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readValidationMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as {
    error?: unknown;
    issues?: Array<{ path?: unknown; message?: unknown }>;
    requestId?: unknown;
  };

  if (Array.isArray(payload.issues) && payload.issues.length > 0) {
    const issue = payload.issues[0];
    const pathLabel =
      Array.isArray(issue.path) && issue.path.length > 0
        ? issue.path.join(".")
        : "payload";
    const message =
      typeof issue.message === "string" ? issue.message : "Invalid input for this field.";
    return `${pathLabel}: ${message}`;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (typeof payload.requestId === "string") {
    return `Validation failed. Request ID: ${payload.requestId}`;
  }

  return fallback;
}

export default function CatalogClient() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [statusText, setStatusText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [openingProductId, setOpeningProductId] = useState<string | null>(null);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [adjustingVariantId, setAdjustingVariantId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<ProductDraft>(makeInitialDraft());
  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inventoryDeltaByVariant, setInventoryDeltaByVariant] = useState<Record<string, string>>(
    {}
  );
  const [inventoryNoteByVariant, setInventoryNoteByVariant] = useState<Record<string, string>>({});

  const categoryFallbackId = useMemo(() => categories[0]?.id ?? "", [categories]);
  const setCreateDraftSafe: DraftSetter = useCallback(
    (updater) => setCreateDraft((prev) => updater(prev)),
    []
  );
  const setEditingDraftSafe: DraftSetter = useCallback(
    (updater) =>
      setEditingProduct((prev) => {
        if (!prev) {
          return prev;
        }
        return updater(prev);
      }),
    []
  );
  const onCategoryCreated = useCallback((category: CategoryItem) => {
    setCategories((prev) => {
      if (prev.some((item) => item.id === category.id)) {
        return prev;
      }

      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const response = await fetch("/api/admin/catalog");
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setLoadError(data.error ?? "Failed to load catalog.");
      setStatusText(
        typeof data?.requestId === "string" ? `Request ID: ${data.requestId}` : "Please retry."
      );
      setLoading(false);
      return;
    }

    setCategories(data.categories);
    setProducts(data.products);
    setCreateDraft((prev) => ({
      ...prev,
      categoryId: prev.categoryId || data.categories[0]?.id || "",
    }));
    setStatusText("");
    setLoadError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  function applyProductToDraft(product: ProductItem): ProductDraft {
    return {
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      currency: product.currency,
      status: product.status,
      categoryId: product.category.id,
      images:
        product.images.length > 0
          ? product.images.map((image) => ({
              id: image.id,
              url: image.url,
              alt: image.alt ?? "",
              variantId: image.variantId ?? null,
              sortOrder: image.sortOrder,
            }))
          : [{ url: "", alt: "", variantId: null, sortOrder: 0 }],
      variants:
        product.variants.length > 0
          ? product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              name: variant.name,
              color: variant.color ?? "",
              size: variant.size ?? "",
              material: variant.material ?? "",
              price: variant.price ?? "",
              compareAtPrice: variant.compareAtPrice ?? "",
              inventory: variant.inventory,
              initialInventory: 0,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder,
            }))
          : [makeEmptyVariant(0)],
    };
  }

  async function openProduct(productId: string) {
    setOpeningProductId(productId);
    const localProduct = products.find((product) => product.id === productId);
    if (localProduct) {
      setEditingProductId(productId);
      setEditingProduct(applyProductToDraft(localProduct));
      setInventoryDeltaByVariant({});
      setInventoryNoteByVariant({});
    }

    try {
      const response = await fetch(`/api/admin/catalog/${productId}`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to load product details.");
        return;
      }

      setEditingProductId(productId);
      setEditingProduct(applyProductToDraft(data.product));
      setInventoryDeltaByVariant({});
      setInventoryNoteByVariant({});
      setStatusText("");
    } catch {
      setStatusText("Unexpected error while loading product details.");
    } finally {
      setOpeningProductId(null);
    }
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setStatusText("");

    const payload = {
      ...createDraft,
      categoryId: createDraft.categoryId || categoryFallbackId,
      images: createDraft.images
        .filter((image) => image.url.trim().length > 0)
        .map((image, index) => ({
          url: image.url,
          alt: image.alt ?? "",
          variantId: image.variantId ?? "",
          sortOrder: Number.isFinite(image.sortOrder) ? image.sortOrder : index,
        })),
      variants: createDraft.variants.map((variant, index) => ({
        sku: variant.sku,
        name: variant.name,
        color: variant.color ?? "",
        size: variant.size ?? "",
        material: variant.material ?? "",
        price: variant.price ?? "",
        compareAtPrice: variant.compareAtPrice ?? "",
        inventory: variant.inventory ?? 0,
        isActive: variant.isActive,
        sortOrder: Number.isFinite(variant.sortOrder) ? variant.sortOrder : index,
      })),
    };

    try {
      const draftCheck = await fetch("/api/admin/catalog/validate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: payload.variants,
        }),
      });
      const draftCheckData = await draftCheck.json();
      if (!draftCheck.ok) {
        setStatusText(readValidationMessage(draftCheckData, "Failed to validate product draft."));
        return;
      }
      if (!draftCheckData.valid || draftCheckData.issues?.length > 0) {
        const firstIssue = draftCheckData.issues?.[0];
        setStatusText(firstIssue?.message ?? "Fix draft issues before creating this product.");
        return;
      }

      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(readValidationMessage(data, "Failed to create product."));
        return;
      }

      setStatusText(`Created product ${data.product.name}.`);
      setCreateDraft(makeInitialDraft(categoryFallbackId));
      await loadCatalog();
    } catch {
      setStatusText("Unexpected error while creating product.");
    } finally {
      setCreating(false);
    }
  }

  async function submitUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProductId || !editingProduct) {
      return;
    }

    setUpdating(true);
    setStatusText("");

    const payload = {
      ...editingProduct,
      images: editingProduct.images
        .filter((image) => image.url.trim().length > 0)
        .map((image, index) => ({
          url: image.url,
          alt: image.alt ?? "",
          variantId: image.variantId ?? "",
          sortOrder: Number.isFinite(image.sortOrder) ? image.sortOrder : index,
        })),
      variants: editingProduct.variants.map((variant, index) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        color: variant.color ?? "",
        size: variant.size ?? "",
        material: variant.material ?? "",
        price: variant.price ?? "",
        compareAtPrice: variant.compareAtPrice ?? "",
        initialInventory: variant.initialInventory ?? 0,
        isActive: variant.isActive,
        sortOrder: Number.isFinite(variant.sortOrder) ? variant.sortOrder : index,
      })),
    };

    try {
      const draftCheck = await fetch("/api/admin/catalog/validate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: editingProductId,
          variants: payload.variants,
        }),
      });
      const draftCheckData = await draftCheck.json();
      if (!draftCheck.ok) {
        setStatusText(readValidationMessage(draftCheckData, "Failed to validate product draft."));
        return;
      }
      if (!draftCheckData.valid || draftCheckData.issues?.length > 0) {
        const firstIssue = draftCheckData.issues?.[0];
        setStatusText(firstIssue?.message ?? "Fix draft issues before saving this product.");
        return;
      }

      const response = await fetch(`/api/admin/catalog/${editingProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(readValidationMessage(data, "Failed to update product."));
        return;
      }

      setStatusText(`Updated product ${data.product.name}.`);
      await loadCatalog();
      await openProduct(editingProductId);
    } catch {
      setStatusText("Unexpected error while updating product.");
    } finally {
      setUpdating(false);
    }
  }

  async function adjustInventory(variantId: string) {
    if (!editingProductId) {
      return;
    }

    const quantityDelta = toInt(inventoryDeltaByVariant[variantId] ?? "0", 0);
    const note = inventoryNoteByVariant[variantId] ?? "";
    if (!quantityDelta) {
      setStatusText("Quantity delta must not be zero.");
      return;
    }
    if (note.trim().length < 4) {
      setStatusText("Please add an inventory adjustment note (at least 4 characters).");
      return;
    }

    setAdjustingVariantId(variantId);
    setStatusText("");
    try {
      const response = await fetch(`/api/admin/catalog/${editingProductId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantityDelta, note }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to adjust inventory.");
        return;
      }

      setStatusText(`Inventory updated for ${data.variant.sku}.`);
      setInventoryDeltaByVariant((prev) => ({ ...prev, [variantId]: "" }));
      setInventoryNoteByVariant((prev) => ({ ...prev, [variantId]: "" }));
      await loadCatalog();
      await openProduct(editingProductId);
    } catch {
      setStatusText("Unexpected error while adjusting inventory.");
    } finally {
      setAdjustingVariantId(null);
    }
  }

  function updateDraftImage(
    setter: DraftSetter,
    index: number,
    key: keyof ProductImageItem,
    value: string
  ) {
    setter((prev) => {
      const next = { ...prev };
      const images = [...next.images];
      const target = { ...images[index] };
      if (key === "sortOrder") {
        target.sortOrder = toInt(value, index);
      } else if (key === "url") {
        target.url = value;
      } else if (key === "alt") {
        target.alt = value;
      } else if (key === "variantId") {
        target.variantId = value || null;
      }
      images[index] = target;
      next.images = images;
      return next;
    });
  }

  function updateDraftVariant(
    setter: DraftSetter,
    index: number,
    key: keyof ProductVariantItem,
    value: string | boolean
  ) {
    setter((prev) => {
      const next = { ...prev };
      const variants = [...next.variants];
      const target = { ...variants[index] };

      if (key === "isActive" && typeof value === "boolean") {
        target.isActive = value;
      } else if (key === "sortOrder" && typeof value === "string") {
        target.sortOrder = toInt(value, index);
      } else if ((key === "inventory" || key === "initialInventory") && typeof value === "string") {
        target[key] = toInt(value, 0);
      } else if (typeof value === "string") {
        (target as Record<string, string | number | boolean | undefined | null>)[key] = value;
      }

      variants[index] = target;
      next.variants = variants;
      return next;
    });
  }

  async function uploadImage(file: File, mode: "create" | "edit") {
    if (mode === "edit" && !editingProduct) {
      return;
    }

    if (mode === "create") {
      setUploadingCreateImage(true);
    } else {
      setUploadingEditImage(true);
    }

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/catalog/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Failed to upload image.");
        return;
      }

      const setter = mode === "create" ? setCreateDraftSafe : setEditingDraftSafe;
      setter((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: data.url,
            alt: "",
            variantId: null,
            sortOrder: prev.images.length,
          },
        ],
      }));

      setStatusText("Image uploaded to R2.");
    } catch {
      setStatusText("Unexpected error while uploading image.");
    } finally {
      if (mode === "create") {
        setUploadingCreateImage(false);
      } else {
        setUploadingEditImage(false);
      }
    }
  }

  return (
    <main className="vintage-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold text-ink">Catalog</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-secondary">
            Orders
          </Link>
          <Link href="/admin/shipping-rules" className="btn-secondary">
            Shipping Rules
          </Link>
          <Link href="/" className="btn-secondary">
            Storefront
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="vintage-panel p-5">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded bg-sepia-border/35" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && loadError ? (
        <section className="vintage-panel border-seal-wax/40 p-5">
          <h2 className="text-xl font-semibold text-ink">Unable to load catalog</h2>
          <p className="mt-2 text-sm text-charcoal">{loadError}</p>
          {statusText ? <p className="mt-1 text-xs text-charcoal/80">{statusText}</p> : null}
          <button type="button" onClick={() => void loadCatalog()} className="btn-primary mt-4">
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !loadError ? (
        <div className="space-y-6">
          <section className="vintage-panel p-5">
            <h2 className="text-2xl font-semibold text-ink">Products</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-parchment text-left text-charcoal">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Inventory</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-sepia-border/60">
                      <td className="px-3 py-2">
                        <p className="font-semibold">{product.name}</p>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`status-pill ${statusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">{product.category.name}</td>
                      <td className="px-3 py-2">
                        {Number(product.price).toLocaleString()} {product.currency}
                      </td>
                      <td className="px-3 py-2">{product.totalInventory}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={openingProductId === product.id}
                          onClick={() => void openProduct(product.id)}
                        >
                          {openingProductId === product.id ? "Opening..." : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-charcoal">
                        No products found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="vintage-panel p-5">
            <h2 className="text-2xl font-semibold text-ink">Create Product</h2>
            <form onSubmit={submitCreate} className="mt-4 space-y-4">
              <ProductFormFields
                draft={createDraft}
                categories={categories}
                onCategoryCreated={onCategoryCreated}
                onDraftChange={setCreateDraftSafe}
                onImageChange={(index, key, value) =>
                  updateDraftImage(setCreateDraftSafe, index, key, value)
                }
                onVariantChange={(index, key, value) =>
                  updateDraftVariant(setCreateDraftSafe, index, key, value)
                }
                onUploadImage={(file) => uploadImage(file, "create")}
                uploadingImage={uploadingCreateImage}
                mode="create"
              />
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-60">
                {creating ? "Creating..." : "Create Product"}
              </button>
            </form>
          </section>

          {editingProduct && editingProductId ? (
            <section className="vintage-panel p-5">
              <h2 className="text-2xl font-semibold text-ink">Edit Product</h2>
              <p className="mt-1 text-sm text-charcoal">Product ID: {editingProductId}</p>
              <form onSubmit={submitUpdate} className="mt-4 space-y-4">
                <ProductFormFields
                  draft={editingProduct}
                  categories={categories}
                  onCategoryCreated={onCategoryCreated}
                  onDraftChange={setEditingDraftSafe}
                  onImageChange={(index, key, value) =>
                    updateDraftImage(setEditingDraftSafe, index, key, value)
                  }
                  onVariantChange={(index, key, value) =>
                    updateDraftVariant(setEditingDraftSafe, index, key, value)
                  }
                  onUploadImage={(file) => uploadImage(file, "edit")}
                  uploadingImage={uploadingEditImage}
                  mode="edit"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={updating} className="btn-primary disabled:opacity-60">
                    {updating ? "Saving..." : "Save Product"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setEditingProductId(null);
                    }}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </form>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-ink">Manual Inventory Adjustment</h3>
                <p className="mt-1 text-sm text-charcoal">
                  Use this for stock corrections. Every change writes an `InventoryLog` entry.
                </p>
                <div className="mt-4 space-y-3">
                  {editingProduct.variants.map((variant) => {
                    if (!variant.id) {
                      return null;
                    }

                    const adjusting = adjustingVariantId === variant.id;
                    return (
                      <div key={variant.id} className="rounded-lg border border-sepia-border p-4">
                        <p className="font-semibold text-ink">
                          {variant.name} ({variant.sku})
                        </p>
                        <p className="text-xs text-charcoal">Current inventory: {variant.inventory ?? 0}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                          <input
                            type="number"
                            value={inventoryDeltaByVariant[variant.id] ?? ""}
                            onChange={(event) =>
                              setInventoryDeltaByVariant((prev) => ({
                                ...prev,
                                [variant.id!]: event.target.value,
                              }))
                            }
                            placeholder="+5 or -2"
                            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                          />
                          <input
                            type="text"
                            value={inventoryNoteByVariant[variant.id] ?? ""}
                            onChange={(event) =>
                              setInventoryNoteByVariant((prev) => ({
                                ...prev,
                                [variant.id!]: event.target.value,
                              }))
                            }
                            placeholder="Reason for adjustment"
                            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => void adjustInventory(variant.id!)}
                            disabled={adjusting}
                            className="btn-secondary disabled:opacity-60"
                          >
                            {adjusting ? "Applying..." : "Apply"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {statusText ? <p className="mt-4 text-sm text-charcoal">{statusText}</p> : null}
    </main>
  );
}

function ProductFormFields({
  draft,
  categories,
  onCategoryCreated,
  onDraftChange,
  onImageChange,
  onVariantChange,
  onUploadImage,
  uploadingImage,
  mode,
}: {
  draft: ProductDraft;
  categories: CategoryItem[];
  onCategoryCreated: (category: CategoryItem) => void;
  onDraftChange: DraftSetter;
  onImageChange: (index: number, key: keyof ProductImageItem, value: string) => void;
  onVariantChange: (
    index: number,
    key: keyof ProductVariantItem,
    value: string | boolean
  ) => void;
  onUploadImage: (file: File) => Promise<void>;
  uploadingImage: boolean;
  mode: "create" | "edit";
}) {
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");
  const [matrixSkuPrefix, setMatrixSkuPrefix] = useState("");
  const [matrixNamePrefix, setMatrixNamePrefix] = useState("");
  const [matrixMaterial, setMatrixMaterial] = useState("");
  const [matrixInitialInventory, setMatrixInitialInventory] = useState("0");
  const [generatingMatrix, setGeneratingMatrix] = useState(false);
  const [matrixFeedback, setMatrixFeedback] = useState("");
  const [selectedVariantIndexes, setSelectedVariantIndexes] = useState<number[]>([]);
  const [bulkMaterial, setBulkMaterial] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState("");
  const [bulkInventory, setBulkInventory] = useState("");
  const [bulkActiveState, setBulkActiveState] = useState<"" | "true" | "false">("");
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState("");
  const [bulkNamePrefix, setBulkNamePrefix] = useState("");
  const [presets, setPresets] = useState<VariantPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [presetFeedback, setPresetFeedback] = useState("");
  const [currentStep, setCurrentStep] = useState<EditorStep>("BASICS");
  const [stepFeedback, setStepFeedback] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState("");
  const variantDiagnostics = useMemo(() => buildVariantDiagnostics(draft.variants), [draft.variants]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const generatedSlug = slugify(draft.name);
    if (!generatedSlug || draft.slug === generatedSlug) {
      return;
    }

    onDraftChange((prev) => ({ ...prev, slug: generatedSlug }));
  }, [mode, draft.name, draft.slug, onDraftChange]);

  useEffect(() => {
    if (!matrixSkuPrefix && draft.slug) {
      setMatrixSkuPrefix(draft.slug);
    }
  }, [draft.slug, matrixSkuPrefix]);

  useEffect(() => {
    if (!matrixNamePrefix && draft.name) {
      setMatrixNamePrefix(draft.name);
    }
  }, [draft.name, matrixNamePrefix]);

  useEffect(() => {
    if (!bulkSkuPrefix && draft.slug) {
      setBulkSkuPrefix(draft.slug);
    }
  }, [bulkSkuPrefix, draft.slug]);

  useEffect(() => {
    if (!bulkNamePrefix && draft.name) {
      setBulkNamePrefix(draft.name);
    }
  }, [bulkNamePrefix, draft.name]);

  useEffect(() => {
    setSelectedVariantIndexes((prev) =>
      prev.filter((index) => index >= 0 && index < draft.variants.length)
    );
  }, [draft.variants.length]);

  useEffect(() => {
    let mounted = true;

    async function loadPresets() {
      try {
        const response = await fetch("/api/admin/catalog/variant-presets");
        const data = await response.json();
        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setPresetFeedback("Unable to load presets.");
          return;
        }

        setPresets((data.presets as VariantPreset[]) ?? []);
      } catch {
        if (mounted) {
          setPresetFeedback("Unable to load presets.");
        }
      }
    }

    void loadPresets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isCategoryModalOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isCategoryModalOpen]);

  async function createCategoryInline() {
    const name = newCategoryName.trim();
    const slug = slugify(name);

    if (!name || !slug) {
      setCategoryFeedback("Category name must include letters or numbers.");
      return;
    }

    setCreatingCategory(true);
    setCategoryFeedback("");

    try {
      const response = await fetch("/api/admin/catalog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setCategoryFeedback(readValidationMessage(data, "Failed to create category."));
        return;
      }

      const category = data.category as CategoryItem;
      onCategoryCreated(category);
      onDraftChange((prev) => ({ ...prev, categoryId: category.id }));
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
      setCategoryFeedback(`Created category "${category.name}".`);
    } catch {
      setCategoryFeedback("Unexpected error while creating category.");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function generateVariantsFromMatrix() {
    const colors = parseListInput(matrixColors);
    const sizes = parseListInput(matrixSizes);
    const skuPrefix = matrixSkuPrefix.trim() || draft.slug.trim();
    const namePrefix = matrixNamePrefix.trim() || draft.name.trim();

    if (!namePrefix || !skuPrefix || colors.length === 0 || sizes.length === 0) {
      setMatrixFeedback("Name prefix, SKU prefix, colors, and sizes are required.");
      return;
    }

    setGeneratingMatrix(true);
    setMatrixFeedback("");

    try {
      const response = await fetch("/api/admin/catalog/variant-matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namePrefix,
          skuPrefix,
          colors,
          sizes,
          material: matrixMaterial.trim(),
          basePrice: draft.price.trim(),
          compareAtPrice: "",
          initialInventory: toInt(matrixInitialInventory, 0),
          isActive: true,
          existing: draft.variants.map((variant) => ({
            color: variant.color ?? "",
            size: variant.size ?? "",
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMatrixFeedback(readValidationMessage(data, "Failed to generate variant matrix."));
        return;
      }

      const rows = (data.rows as VariantMatrixRow[]) ?? [];
      const newRows = rows.filter((row) => !row.exists);

      if (newRows.length === 0) {
        setMatrixFeedback("All combinations already exist in this draft.");
        return;
      }

      onDraftChange((prev) => {
        const nextSortOrderStart = prev.variants.length;
        const appended: ProductVariantItem[] = newRows.map((row, index) => ({
          sku: row.sku,
          name: row.name,
          color: row.color,
          size: row.size,
          material: row.material ?? "",
          price: row.price ?? "",
          compareAtPrice: row.compareAtPrice ?? "",
          inventory: row.initialInventory,
          initialInventory: row.initialInventory,
          isActive: row.isActive,
          sortOrder: nextSortOrderStart + index,
        }));

        return {
          ...prev,
          variants: [...prev.variants, ...appended],
        };
      });

      setMatrixFeedback(
        `Generated ${data.summary.newRows} new variants (${data.summary.existing} already existed).`
      );
    } catch {
      setMatrixFeedback("Unexpected error while generating variants.");
    } finally {
      setGeneratingMatrix(false);
    }
  }

  function applyBulkVariantFields() {
    if (selectedVariantIndexes.length === 0) {
      setBulkFeedback("Select at least one variant first.");
      return;
    }

    const shouldUpdateMaterial = bulkMaterial.trim().length > 0;
    const shouldUpdatePrice = bulkPrice.trim().length > 0;
    const shouldUpdateCompareAtPrice = bulkCompareAtPrice.trim().length > 0;
    const shouldUpdateInventory = bulkInventory.trim().length > 0;
    const shouldUpdateActive = bulkActiveState !== "";

    if (
      !shouldUpdateMaterial &&
      !shouldUpdatePrice &&
      !shouldUpdateCompareAtPrice &&
      !shouldUpdateInventory &&
      !shouldUpdateActive
    ) {
      setBulkFeedback("Set at least one field to apply.");
      return;
    }

    const selected = new Set(selectedVariantIndexes);
    const selectedWithStock = draft.variants.filter(
      (variant, index) => selected.has(index) && (variant.inventory ?? 0) > 0
    ).length;
    if (shouldUpdateActive && bulkActiveState === "false" && selectedWithStock > 0) {
      const confirmed = window.confirm(
        `${selectedWithStock} selected variant(s) still have stock and will be set inactive. Continue?`
      );
      if (!confirmed) {
        return;
      }
    }
    const inventoryValue = toInt(bulkInventory, 0);
    const inventoryKey: "inventory" | "initialInventory" =
      mode === "create" ? "inventory" : "initialInventory";

    onDraftChange((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) => {
        if (!selected.has(index)) {
          return variant;
        }

        return {
          ...variant,
          material: shouldUpdateMaterial ? bulkMaterial.trim() : variant.material,
          price: shouldUpdatePrice ? bulkPrice.trim() : variant.price,
          compareAtPrice: shouldUpdateCompareAtPrice
            ? bulkCompareAtPrice.trim()
            : variant.compareAtPrice,
          isActive:
            shouldUpdateActive ? bulkActiveState === "true" : variant.isActive,
          [inventoryKey]: shouldUpdateInventory ? Math.max(0, inventoryValue) : variant[inventoryKey],
        };
      }),
    }));

    setBulkFeedback(`Updated ${selectedVariantIndexes.length} selected variants.`);
  }

  function removeSelectedVariants() {
    if (selectedVariantIndexes.length === 0) {
      setBulkFeedback("Select variants to remove.");
      return;
    }

    const selected = new Set(selectedVariantIndexes);
    const selectedWithStock = draft.variants.filter(
      (variant, index) => selected.has(index) && (variant.inventory ?? 0) > 0
    ).length;
    const confirmMessage =
      selectedWithStock > 0
        ? `You are removing ${selectedVariantIndexes.length} variant(s), including ${selectedWithStock} with stock. Continue?`
        : `Remove ${selectedVariantIndexes.length} selected variant(s)?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    onDraftChange((prev) => {
      const filtered = prev.variants
        .filter((_, index) => !selected.has(index))
        .map((variant, index) => ({ ...variant, sortOrder: index }));

      return {
        ...prev,
        variants: filtered.length > 0 ? filtered : [makeEmptyVariant(0)],
      };
    });

    setSelectedVariantIndexes([]);
    setBulkFeedback("Removed selected variants.");
  }

  function normalizeVariantSortOrder() {
    onDraftChange((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) => ({
        ...variant,
        sortOrder: index,
      })),
    }));
    setBulkFeedback("Normalized variant sort order.");
  }

  function duplicateSelectedVariants() {
    if (selectedVariantIndexes.length === 0) {
      setBulkFeedback("Select variants to duplicate.");
      return;
    }

    const selected = new Set(selectedVariantIndexes);
    onDraftChange((prev) => {
      const clones = prev.variants
        .filter((_, index) => selected.has(index))
        .map((variant, offset) => ({
          ...variant,
          id: undefined,
          sku: `${variant.sku}-COPY-${offset + 1}`,
          initialInventory: 0,
          inventory: mode === "create" ? variant.inventory ?? 0 : 0,
          sortOrder: prev.variants.length + offset,
        }));

      return {
        ...prev,
        variants: [...prev.variants, ...clones],
      };
    });

    setBulkFeedback(`Duplicated ${selectedVariantIndexes.length} variants.`);
  }

  function autofillSelectedVariantIdentity() {
    if (selectedVariantIndexes.length === 0) {
      setBulkFeedback("Select variants first.");
      return;
    }

    const selected = new Set(selectedVariantIndexes);
    const skuPrefix = toSkuToken(bulkSkuPrefix || draft.slug);
    const namePrefix = bulkNamePrefix.trim() || draft.name.trim();
    if (!skuPrefix || !namePrefix) {
      setBulkFeedback("SKU prefix and name prefix are required.");
      return;
    }

    onDraftChange((prev) => {
      const usedSku = new Set(
        prev.variants
          .map((variant, index) => (selected.has(index) ? "" : variant.sku.trim().toUpperCase()))
          .filter(Boolean)
      );

      const nextVariants = prev.variants.map((variant, index) => {
        if (!selected.has(index)) {
          return variant;
        }

        const color = (variant.color ?? "").trim();
        const size = (variant.size ?? "").trim();
        let candidateSku = variant.sku.trim().toUpperCase();

        if (!candidateSku) {
          const core = `${skuPrefix}-${toSkuToken(color || "NA")}-${toSkuToken(size || "NA")}`;
          candidateSku = core;
          let seq = 2;
          while (usedSku.has(candidateSku)) {
            candidateSku = `${core}-${seq}`;
            seq += 1;
          }
        } else if (usedSku.has(candidateSku)) {
          const core = `${skuPrefix}-${toSkuToken(color || "NA")}-${toSkuToken(size || "NA")}`;
          candidateSku = core;
          let seq = 2;
          while (usedSku.has(candidateSku)) {
            candidateSku = `${core}-${seq}`;
            seq += 1;
          }
        }

        usedSku.add(candidateSku);
        return {
          ...variant,
          sku: candidateSku,
          name: variant.name.trim() || `${namePrefix} - ${color || "Default"} / ${size || "Default"}`,
        };
      });

      return {
        ...prev,
        variants: nextVariants,
      };
    });

    setBulkFeedback("Auto-filled selected variant names and SKUs.");
  }

  function applySelectedPreset() {
    const preset = presets.find((item) => item.id === selectedPresetId);
    if (!preset) {
      setPresetFeedback("Select a preset first.");
      return;
    }

    setMatrixNamePrefix(preset.namePrefix);
    setMatrixSkuPrefix(preset.skuPrefix);
    setMatrixMaterial(preset.material);
    setMatrixColors(preset.colors.join(", "));
    setMatrixSizes(preset.sizes.join(", "));
    setPresetFeedback(`Applied preset: ${preset.name}`);
  }

  function validateStep(step: EditorStep): string | null {
    if (step === "BASICS") {
      if (!draft.name.trim()) return "Product name is required.";
      if (!draft.slug.trim()) {
        return "Product name must include letters or numbers.";
      }
      if (!draft.price.trim()) return "Base price is required.";
      if (!draft.categoryId.trim()) return "Category is required.";
    }

    if (step === "IMAGES") {
      const hasImage = draft.images.some((image) => image.url.trim().length > 0);
      if (!hasImage) return "Add at least one image URL or upload an image.";
    }

    if (step === "VARIANTS") {
      if (variantDiagnostics.hasBlocking) {
        return "Resolve variant warnings before moving to review.";
      }
    }

    return null;
  }

  function goToNextStep() {
    const error = validateStep(currentStep);
    if (error) {
      setStepFeedback(error);
      return;
    }

    const currentIndex = editorSteps.indexOf(currentStep);
    if (currentIndex < editorSteps.length - 1) {
      setCurrentStep(editorSteps[currentIndex + 1]);
      setStepFeedback("");
    }
  }

  function goToPreviousStep() {
    const currentIndex = editorSteps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(editorSteps[currentIndex - 1]);
      setStepFeedback("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-sepia-border/70 bg-paper-light/30 p-3">
        <p className="mb-2 text-xs uppercase tracking-[0.08em] text-charcoal">Editor Steps</p>
        <div className="flex flex-wrap gap-2">
          {editorSteps.map((step) => (
            <button
              key={step}
              type="button"
              className={`border px-3 py-1.5 text-xs uppercase tracking-[0.08em] ${
                currentStep === step
                  ? "border-ink bg-ink text-paper-light"
                  : "border-sepia-border text-charcoal"
              }`}
              onClick={() => {
                setCurrentStep(step);
                setStepFeedback("");
              }}
            >
              {editorStepLabel(step)}
            </button>
          ))}
        </div>
        {stepFeedback ? <p className="mt-2 text-xs text-seal-wax">{stepFeedback}</p> : null}
      </div>

      <div className={currentStep === "BASICS" ? "space-y-4" : "hidden"}>
      {mode === "create" ? (
        <p className="text-xs text-charcoal">
          Variant image mapping is available after first save (when variant IDs exist).
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-1">
        <input
          value={draft.name}
          onChange={(event) => {
            const nextName = event.target.value;
            onDraftChange((prev) => ({ ...prev, name: nextName }));
          }}
          placeholder="Product name"
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        />
      </div>

      <textarea
        value={draft.description}
        onChange={(event) =>
          onDraftChange((prev) => ({ ...prev, description: event.target.value }))
        }
        placeholder="Description"
        className="min-h-24 w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2"
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <input
          value={draft.price}
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, price: event.target.value }))
          }
          placeholder="Base price"
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        />
        <input
          value={draft.currency}
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, currency: event.target.value }))
          }
          placeholder="MMK"
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        />
        <select
          value={draft.status}
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, status: event.target.value as ProductStatus }))
          }
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={draft.categoryId}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "__create__") {
              setCategoryFeedback("");
              setNewCategoryName("");
              setIsCategoryModalOpen(true);
              return;
            }
            onDraftChange((prev) => ({ ...prev, categoryId: value }));
          }}
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value="__create__">+ Create category</option>
        </select>
      </div>
      {categoryFeedback ? <p className="text-xs text-charcoal">{categoryFeedback}</p> : null}
      {isCategoryModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-[1px]"
          role="presentation"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create category"
            className="mx-auto mt-24 w-[min(92vw,460px)] border border-sepia-border bg-parchment p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Category</p>
                <h4 className="text-lg font-semibold text-ink">Create New Category</h4>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createCategoryInline();
                  }
                }}
                placeholder="Category name"
                className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <p className="text-xs text-charcoal">Slug will be generated automatically.</p>
              {categoryFeedback ? <p className="text-xs text-charcoal">{categoryFeedback}</p> : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingCategory}
                  onClick={() => void createCategoryInline()}
                  className="btn-primary disabled:opacity-60"
                >
                  {creatingCategory ? "Creating..." : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>

      <div className={`${currentStep === "IMAGES" ? "space-y-2" : "hidden"} rounded-md border border-sepia-border p-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Images</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(event) => setSelectedImageFile(event.target.files?.[0] ?? null)}
              className="max-w-52 text-xs text-charcoal file:mr-2 file:rounded-md file:border file:border-sepia-border file:bg-paper-light file:px-2 file:py-1 file:text-xs"
            />
            <button
              type="button"
              disabled={!selectedImageFile || uploadingImage}
              className="btn-secondary disabled:opacity-60"
              onClick={async () => {
                if (!selectedImageFile) {
                  return;
                }
                await onUploadImage(selectedImageFile);
                setSelectedImageFile(null);
              }}
            >
              {uploadingImage ? "Uploading..." : "Upload to R2"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onDraftChange((prev) => ({
                  ...prev,
                  images: [
                    ...prev.images,
                    { url: "", alt: "", variantId: null, sortOrder: prev.images.length },
                  ],
                }))
              }
            >
              Add URL Row
            </button>
          </div>
        </div>
        {draft.images.map((image, index) => (
          <div
            key={`image-${index}`}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_180px_100px_auto]"
          >
            <input
              value={image.url}
              onChange={(event) => onImageChange(index, "url", event.target.value)}
              placeholder="Image URL"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <input
              value={image.alt ?? ""}
              onChange={(event) => onImageChange(index, "alt", event.target.value)}
              placeholder="Alt text"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <select
              value={image.variantId ?? ""}
              onChange={(event) => onImageChange(index, "variantId", event.target.value)}
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            >
              <option value="">Unassigned (all variants)</option>
              {draft.variants
                .filter((variant): variant is ProductVariantItem & { id: string } => Boolean(variant.id))
                .map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku} {variant.color ? `(${variant.color}` : ""}{" "}
                    {variant.size ? `${variant.color ? "/" : "("}${variant.size}` : ""}
                    {variant.color || variant.size ? ")" : ""}
                  </option>
                ))}
            </select>
            <input
              type="number"
              value={image.sortOrder}
              onChange={(event) => onImageChange(index, "sortOrder", event.target.value)}
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onDraftChange((prev) =>
                  prev.images.length > 1
                    ? { ...prev, images: prev.images.filter((_, itemIndex) => itemIndex !== index) }
                    : prev
                )
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={`${currentStep === "VARIANTS" ? "space-y-2" : "hidden"} rounded-md border border-sepia-border p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">Variants</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedVariantIndexes(draft.variants.map((_, index) => index))}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedVariantIndexes([])}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                onDraftChange((prev) =>
                  ({
                    ...prev,
                    variants: [...prev.variants, makeEmptyVariant(prev.variants.length)],
                  })
                )
              }
            >
              Add Variant
            </button>
          </div>
        </div>
        <p className="text-xs text-charcoal">{selectedVariantIndexes.length} selected</p>

        <div className="space-y-2 rounded-md border border-sepia-border/70 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-charcoal">
            Bulk Apply to Selected
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={bulkNamePrefix}
              onChange={(event) => setBulkNamePrefix(event.target.value)}
              placeholder="Name prefix for autofill"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <input
              value={bulkSkuPrefix}
              onChange={(event) => setBulkSkuPrefix(event.target.value)}
              placeholder="SKU prefix for autofill"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={bulkMaterial}
              onChange={(event) => setBulkMaterial(event.target.value)}
              placeholder="Material"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <input
              value={bulkPrice}
              onChange={(event) => setBulkPrice(event.target.value)}
              placeholder="Price"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <input
              value={bulkCompareAtPrice}
              onChange={(event) => setBulkCompareAtPrice(event.target.value)}
              placeholder="Compare-at price"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={bulkInventory}
              onChange={(event) => setBulkInventory(event.target.value)}
              placeholder={mode === "create" ? "Inventory" : "Initial inventory"}
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
            <select
              value={bulkActiveState}
              onChange={(event) => setBulkActiveState(event.target.value as "" | "true" | "false")}
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            >
              <option value="">Leave active state unchanged</option>
              <option value="true">Set active</option>
              <option value="false">Set inactive</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary" onClick={applyBulkVariantFields}>
              Apply Bulk Changes
            </button>
            <button type="button" className="btn-secondary" onClick={autofillSelectedVariantIdentity}>
              Auto-fill Name/SKU
            </button>
            <button type="button" className="btn-secondary" onClick={duplicateSelectedVariants}>
              Duplicate Selected
            </button>
            <button type="button" className="btn-secondary" onClick={normalizeVariantSortOrder}>
              Normalize Sort Order
            </button>
            <button type="button" className="btn-secondary" onClick={removeSelectedVariants}>
              Remove Selected
            </button>
            {bulkFeedback ? <p className="text-xs text-charcoal">{bulkFeedback}</p> : null}
          </div>
        </div>

        {draft.variants.map((variant, index) => (
          <div
            key={`variant-${variant.id ?? index}`}
            className={`rounded-md border p-3 ${
              (variantDiagnostics.issuesByIndex[index]?.length ?? 0) > 0
                ? "border-seal-wax/70 bg-seal-wax/5"
                : "border-sepia-border/70"
            }`}
          >
            <label className="mb-2 inline-flex items-center gap-2 text-xs text-charcoal">
              <input
                type="checkbox"
                checked={selectedVariantIndexes.includes(index)}
                onChange={(event) =>
                  setSelectedVariantIndexes((prev) => {
                    if (event.target.checked) {
                      return [...prev, index].sort((a, b) => a - b);
                    }
                    return prev.filter((item) => item !== index);
                  })
                }
              />
              Select
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={variant.sku}
                onChange={(event) => onVariantChange(index, "sku", event.target.value)}
                placeholder="SKU"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.name}
                onChange={(event) => onVariantChange(index, "name", event.target.value)}
                placeholder="Variant name"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.color ?? ""}
                onChange={(event) => onVariantChange(index, "color", event.target.value)}
                placeholder="Color"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.size ?? ""}
                onChange={(event) => onVariantChange(index, "size", event.target.value)}
                placeholder="Size"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.material ?? ""}
                onChange={(event) => onVariantChange(index, "material", event.target.value)}
                placeholder="Material"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.price ?? ""}
                onChange={(event) => onVariantChange(index, "price", event.target.value)}
                placeholder="Variant price (optional)"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              <input
                value={variant.compareAtPrice ?? ""}
                onChange={(event) => onVariantChange(index, "compareAtPrice", event.target.value)}
                placeholder="Compare at price (optional)"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
              {mode === "create" ? (
                <input
                  type="number"
                  value={variant.inventory ?? 0}
                  onChange={(event) => onVariantChange(index, "inventory", event.target.value)}
                  placeholder="Inventory"
                  className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type="number"
                  value={variant.initialInventory ?? 0}
                  onChange={(event) => onVariantChange(index, "initialInventory", event.target.value)}
                  placeholder="Initial inventory (new variants only)"
                  className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                />
              )}
              <input
                type="number"
                value={variant.sortOrder}
                onChange={(event) => onVariantChange(index, "sortOrder", event.target.value)}
                placeholder="Sort order"
                className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-charcoal">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(event) => onVariantChange(index, "isActive", event.target.checked)}
                />
                Active
              </label>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const hasStock = (variant.inventory ?? 0) > 0;
                  const confirmed = window.confirm(
                    hasStock
                      ? `This variant has stock (${variant.inventory ?? 0}). Remove it anyway?`
                      : "Remove this variant?"
                  );
                  if (!confirmed) {
                    return;
                  }

                  onDraftChange((prev) =>
                    prev.variants.length > 1
                      ? {
                          ...prev,
                          variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                        }
                      : prev
                  );
                }}
              >
                Remove Variant
              </button>
            </div>
            {(variantDiagnostics.issuesByIndex[index]?.length ?? 0) > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-seal-wax">
                {variantDiagnostics.issuesByIndex[index].map((issue) => (
                  <li key={`${index}-${issue}`}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>

      <div className={`${currentStep === "VARIANTS" ? "space-y-3" : "hidden"} rounded-md border border-sepia-border p-3`}>
        <h3 className="text-sm font-semibold text-ink">Variant Matrix Generator</h3>
        <p className="text-xs text-charcoal">
          Generate color x size combinations and append only missing variants.
        </p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={selectedPresetId}
            onChange={(event) => setSelectedPresetId(event.target.value)}
            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          >
            <option value="">Select preset</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary" onClick={applySelectedPreset}>
            Apply Preset
          </button>
        </div>
        {presetFeedback ? <p className="text-xs text-charcoal">{presetFeedback}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={matrixNamePrefix}
            onChange={(event) => setMatrixNamePrefix(event.target.value)}
            placeholder="Name prefix (e.g. Core Hoodie)"
            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
          <input
            value={matrixSkuPrefix}
            onChange={(event) => setMatrixSkuPrefix(event.target.value)}
            placeholder="SKU prefix (e.g. CORE-HOODIE)"
            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
          <textarea
            value={matrixColors}
            onChange={(event) => setMatrixColors(event.target.value)}
            placeholder="Colors (comma or newline separated)"
            className="min-h-20 rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
          <textarea
            value={matrixSizes}
            onChange={(event) => setMatrixSizes(event.target.value)}
            placeholder="Sizes (comma or newline separated)"
            className="min-h-20 rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
          <input
            value={matrixMaterial}
            onChange={(event) => setMatrixMaterial(event.target.value)}
            placeholder="Material (optional)"
            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={matrixInitialInventory}
            onChange={(event) => setMatrixInitialInventory(event.target.value)}
            placeholder="Initial inventory"
            className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void generateVariantsFromMatrix()}
            disabled={generatingMatrix}
            className="btn-secondary disabled:opacity-60"
          >
            {generatingMatrix ? "Generating..." : "Generate Missing Variants"}
          </button>
          {matrixFeedback ? <p className="text-xs text-charcoal">{matrixFeedback}</p> : null}
        </div>
      </div>

      <section className={`${currentStep === "REVIEW" ? "space-y-3" : "hidden"} rounded-md border border-sepia-border p-4`}>
        <h3 className="text-lg font-semibold text-ink">Review Before Save</h3>
        <div className="grid gap-2 text-sm text-charcoal sm:grid-cols-2">
          <p><span className="font-semibold text-ink">Name:</span> {draft.name || "-"}</p>
          <p>
            <span className="font-semibold text-ink">Category:</span>{" "}
            {categories.find((item) => item.id === draft.categoryId)?.name ?? "-"}
          </p>
          <p><span className="font-semibold text-ink">Base Price:</span> {draft.price || "-"} {draft.currency}</p>
          <p><span className="font-semibold text-ink">Images:</span> {draft.images.filter((image) => image.url.trim()).length}</p>
          <p><span className="font-semibold text-ink">Variants:</span> {draft.variants.length}</p>
          <p><span className="font-semibold text-ink">Active Variants:</span> {draft.variants.filter((variant) => variant.isActive).length}</p>
          <p><span className="font-semibold text-ink">New Variants:</span> {draft.variants.filter((variant) => !variant.id).length}</p>
        </div>
        <p className="text-xs text-charcoal">
          Use the Save/Create button below when this summary looks correct.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sepia-border/60 pt-3">
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={goToPreviousStep}
          disabled={currentStep === "BASICS"}
        >
          Back
        </button>
        <p className="text-xs uppercase tracking-[0.08em] text-charcoal">{editorStepLabel(currentStep)}</p>
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={goToNextStep}
          disabled={currentStep === "REVIEW"}
        >
          Next
        </button>
      </div>
    </div>
  );
}
