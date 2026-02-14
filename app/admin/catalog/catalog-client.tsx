"use client";

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

function makeInitialDraft(categoryId = ""): ProductDraft {
  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    currency: "MMK",
    status: "DRAFT",
    categoryId,
    images: [{ url: "", alt: "", sortOrder: 0 }],
    variants: [
      {
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
        sortOrder: 0,
      },
    ],
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
              sortOrder: image.sortOrder,
            }))
          : [{ url: "", alt: "", sortOrder: 0 }],
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
          : [
              {
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
                sortOrder: 0,
              },
            ],
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
                        <p className="text-xs text-charcoal/75">{product.slug}</p>
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
  onDraftChange,
  onImageChange,
  onVariantChange,
  onUploadImage,
  uploadingImage,
  mode,
}: {
  draft: ProductDraft;
  categories: CategoryItem[];
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={draft.name}
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="Product name"
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        />
        <input
          value={draft.slug}
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, slug: event.target.value }))
          }
          placeholder="product-slug"
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
          onChange={(event) =>
            onDraftChange((prev) => ({ ...prev, categoryId: event.target.value }))
          }
          className="rounded-md border border-sepia-border bg-paper-light px-3 py-2"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 rounded-md border border-sepia-border p-3">
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
                  images: [...prev.images, { url: "", alt: "", sortOrder: prev.images.length }],
                }))
              }
            >
              Add URL Row
            </button>
          </div>
        </div>
        {draft.images.map((image, index) => (
          <div key={`image-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_auto]">
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

      <div className="space-y-2 rounded-md border border-sepia-border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Variants</h3>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              onDraftChange((prev) =>
                ({
                  ...prev,
                  variants: [
                    ...prev.variants,
                    {
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
                      sortOrder: prev.variants.length,
                    },
                  ],
                })
              )
            }
          >
            Add Variant
          </button>
        </div>
        {draft.variants.map((variant, index) => (
          <div key={`variant-${variant.id ?? index}`} className="rounded-md border border-sepia-border/70 p-3">
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
                onClick={() =>
                  onDraftChange((prev) =>
                    prev.variants.length > 1
                      ? {
                          ...prev,
                          variants: prev.variants.filter((_, itemIndex) => itemIndex !== index),
                        }
                      : prev
                  )
                }
              >
                Remove Variant
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
