"use client";

import {
  type CatalogDraft,
  createEmptyVariant,
  createInitialCatalogDraft,
  slugifyCatalogValue,
  type CatalogDraftImage,
  type CatalogDraftVariant,
  type ProductStatus,
} from "@/lib/admin/catalog-draft-contract";
import {
  catalogEditorStepRegistry,
  type CatalogEditorStepId,
} from "@/lib/admin/catalog-step-registry";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CreateProductPreviewCard } from "@/components/admin/catalog/create-product-preview-card";
import { CreateProductSectionCard } from "@/components/admin/catalog/create-product-section-card";
import { AdminWizardShell } from "@/components/admin/wizard/admin-wizard-shell";
import { CSS } from "@dnd-kit/utilities";
import { buildVariantDiagnostics, toSkuToken } from "@/lib/admin/variant-editor";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
};

type ProductImageItem = CatalogDraftImage;
type ProductVariantItem = CatalogDraftVariant;

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

type UploadQueueStatus = "queued" | "uploading" | "done" | "failed";

type UploadQueueItem = {
  id: string;
  file: File;
  status: UploadQueueStatus;
  progressPct: number;
  error?: string;
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

type DraftSetter = (updater: (prev: CatalogDraft) => CatalogDraft) => void;

const statusOptions: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

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

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }
  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("SIGN_UPLOAD_FAILED")) {
    return "Could not prepare upload. Please retry.";
  }
  if (message.includes("UPLOAD_FAILED_")) {
    return "Direct upload failed. Trying fallback upload failed too.";
  }
  if (message.includes("UPLOAD_NETWORK_ERROR")) {
    return "Network error while uploading. Check your connection and retry.";
  }
  if (message.includes("INVALID_FILE_TYPE")) {
    return "Unsupported file type. Use JPG, PNG, WEBP, or AVIF.";
  }
  if (message.includes("FILE_TOO_LARGE")) {
    return "File is too large. Maximum is 8MB.";
  }

  return "Upload failed. Try again.";
}

function normalizeImageSortOrder(images: ProductImageItem[]): ProductImageItem[] {
  return images.map((image, imageIndex) => ({ ...image, sortOrder: imageIndex }));
}

function reorderImages(
  images: ProductImageItem[],
  fromIndex: number,
  toIndex: number
): ProductImageItem[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= images.length ||
    toIndex >= images.length ||
    fromIndex === toIndex
  ) {
    return images;
  }

  return normalizeImageSortOrder(arrayMove(images, fromIndex, toIndex));
}

type SortableImageRowProps = {
  dndId: string;
  index: number;
  image: ProductImageItem;
  totalImages: number;
  isQueueUploading: boolean;
  variantOptions: Array<{ id: string; label: string }>;
  onImageChange: (index: number, key: keyof ProductImageItem, value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onMakePrimary: (index: number) => void;
};

function SortableImageRow({
  dndId,
  index,
  image,
  totalImages,
  isQueueUploading,
  variantOptions,
  onImageChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onMakePrimary,
}: SortableImageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
    disabled: isQueueUploading || totalImages <= 1,
  });
  const imageUrl = image.url.trim();
  const hasPreview = imageUrl.length > 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid gap-2 rounded-md border border-sepia-border/60 p-2 lg:grid-cols-12 ${
        isDragging ? "bg-paper-light/50 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2 lg:col-span-12">
        <span className="text-xs text-charcoal">Image {index + 1}</span>
      </div>

      <div className="overflow-hidden rounded-md border border-sepia-border bg-parchment/60 lg:col-span-2">
        <div
          className="relative aspect-[4/5] w-full"
        >
          {hasPreview ? (
            <Image
              src={imageUrl}
              alt={image.alt?.trim() || `Product image ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 240px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.08em] text-charcoal/70">
              No Preview
            </div>
          )}
          <button
            type="button"
            className="absolute left-2 top-2 inline-flex h-6 items-center justify-center rounded-full border border-sepia-border bg-parchment/95 px-2 text-[10px] uppercase tracking-[0.08em] text-charcoal shadow-sm touch-none"
            aria-label={`Reorder image ${index + 1}`}
            disabled={isQueueUploading || totalImages <= 1}
            {...attributes}
            {...listeners}
          >
            Drag
          </button>
          <button
            type="button"
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-sepia-border bg-parchment/95 text-sm leading-none text-ink shadow-sm"
            disabled={isQueueUploading || totalImages <= 1}
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={() => onRemove(index)}
            aria-label={`Remove image ${index + 1}`}
          >
            ×
          </button>
        </div>
      </div>
      <div className="space-y-2 lg:col-span-10">
        <div className="grid gap-2 lg:grid-cols-7">
          <input
            value={image.alt ?? ""}
            onChange={(event) => onImageChange(index, "alt", event.target.value)}
            placeholder="Alt text"
            className="min-w-0 rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm lg:col-span-3"
          />
          <select
            value={image.variantId ?? ""}
            onChange={(event) => onImageChange(index, "variantId", event.target.value)}
            className="min-w-0 rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm lg:col-span-2"
          >
            <option value="">Unassigned</option>
            {variantOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-xs uppercase tracking-[0.08em] text-charcoal lg:col-span-2">
            {index === 0 ? "Primary" : "Drag to reorder"}
          </div>
        </div>
        <p className="text-xs text-charcoal/80">
          {hasPreview ? "Drag image cards to reorder. First image is used as primary." : "Upload a file to preview this image."}
        </p>
        <div className="flex flex-wrap items-center gap-2 lg:hidden">
          <button
            type="button"
            className="btn-secondary px-2 py-1 text-xs"
            disabled={isQueueUploading || index === 0}
            onClick={() => onMoveUp(index)}
          >
            Move Up
          </button>
          <button
            type="button"
            className="btn-secondary px-2 py-1 text-xs"
            disabled={isQueueUploading || index >= totalImages - 1}
            onClick={() => onMoveDown(index)}
          >
            Move Down
          </button>
          <button
            type="button"
            className="btn-secondary px-2 py-1 text-xs"
            disabled={isQueueUploading || index === 0}
            onClick={() => onMakePrimary(index)}
          >
            Set Primary
          </button>
        </div>
      </div>
    </div>
  );
}

type CatalogClientView = "all" | "list" | "create";

type CatalogClientProps = {
  view?: CatalogClientView;
};

type SubmitIntent = "draft" | "publish";

type ValidationStepHint = {
  step: CatalogEditorStepId;
  message: string;
};

function toIssuePathString(path: unknown): string {
  if (Array.isArray(path)) {
    return path.map((part) => String(part)).join(".");
  }
  if (typeof path === "string") {
    return path;
  }
  return "";
}

function inferStepFromIssuePath(path: string): CatalogEditorStepId {
  if (!path) {
    return "REVIEW";
  }
  if (path.startsWith("variants")) {
    return "GENERATE";
  }
  if (path.startsWith("images")) {
    return "COMPOSE";
  }
  if (
    path.startsWith("name") ||
    path.startsWith("slug") ||
    path.startsWith("description") ||
    path.startsWith("price") ||
    path.startsWith("currency") ||
    path.startsWith("status") ||
    path.startsWith("categoryId")
  ) {
    return "COMPOSE";
  }
  return "REVIEW";
}

function readValidationStepHint(data: unknown, fallbackMessage: string): ValidationStepHint | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as {
    issues?: Array<{ path?: unknown; message?: unknown }>;
    error?: unknown;
  };

  const firstIssue = Array.isArray(payload.issues) ? payload.issues[0] : null;
  if (firstIssue) {
    const path = toIssuePathString(firstIssue.path);
    return {
      step: inferStepFromIssuePath(path),
      message:
        typeof firstIssue.message === "string" && firstIssue.message.trim().length > 0
          ? firstIssue.message
          : fallbackMessage,
    };
  }

  if (typeof payload.error === "string" && payload.error.trim().length > 0) {
    return {
      step: "REVIEW",
      message: payload.error,
    };
  }

  return null;
}

function CatalogEditorForm({
  title,
  subtitle,
  draft,
  draftIdentity,
  currentStep,
  onCurrentStepChange,
  categories,
  onCategoryCreated,
  onDraftChange,
  onImageChange,
  onVariantChange,
  onUploadImage,
  mode,
  onSubmit,
  submitting,
  submitIntent,
  onSubmitIntentChange,
  onClose,
}: {
  title: string;
  subtitle?: string;
  draft: CatalogDraft;
  draftIdentity: string;
  currentStep: CatalogEditorStepId;
  onCurrentStepChange: (step: CatalogEditorStepId) => void;
  categories: CategoryItem[];
  onCategoryCreated: (category: CategoryItem) => void;
  onDraftChange: DraftSetter;
  onImageChange: (index: number, key: keyof ProductImageItem, value: string) => void;
  onVariantChange: (
    index: number,
    key: keyof ProductVariantItem,
    value: string | boolean
  ) => void;
  onUploadImage: (file: File, onProgress: (progressPct: number) => void) => Promise<void>;
  mode: "create" | "edit";
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  submitting: boolean;
  submitIntent: SubmitIntent;
  onSubmitIntentChange: (intent: SubmitIntent) => void;
  onClose?: () => void;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-charcoal">{subtitle}</p> : null}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <ProductFormFields
          draft={draft}
          draftIdentity={draftIdentity}
          currentStep={currentStep}
          onCurrentStepChange={onCurrentStepChange}
          categories={categories}
          onCategoryCreated={onCategoryCreated}
          onDraftChange={onDraftChange}
          onImageChange={onImageChange}
          onVariantChange={onVariantChange}
          onUploadImage={onUploadImage}
          mode={mode}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            onClick={() => onSubmitIntentChange("draft")}
            className="btn-secondary disabled:opacity-60"
          >
            {submitting && submitIntent === "draft" ? "Saving Draft..." : "Save Draft"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            onClick={() => onSubmitIntentChange("publish")}
            className="btn-primary disabled:opacity-60"
          >
            {submitting && submitIntent === "publish" ? "Publishing..." : "Publish"}
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export default function CatalogClient({ view = "all" }: CatalogClientProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [statusText, setStatusText] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [openingProductId, setOpeningProductId] = useState<string | null>(null);
  const [adjustingVariantId, setAdjustingVariantId] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<CatalogDraft>(createInitialCatalogDraft());
  const [createCurrentStep, setCreateCurrentStep] = useState<CatalogEditorStepId>("COMPOSE");
  const [createSubmitIntent, setCreateSubmitIntent] = useState<SubmitIntent>("draft");
  const [editingProduct, setEditingProduct] = useState<CatalogDraft | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editCurrentStep, setEditCurrentStep] = useState<CatalogEditorStepId>("COMPOSE");
  const [editSubmitIntent, setEditSubmitIntent] = useState<SubmitIntent>("draft");
  const [inventoryDeltaByVariant, setInventoryDeltaByVariant] = useState<Record<string, string>>(
    {}
  );
  const [inventoryNoteByVariant, setInventoryNoteByVariant] = useState<Record<string, string>>({});
  const showProductList = view !== "create";
  const showCreateForm = view !== "list";

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

  function applyProductToDraft(product: ProductItem): CatalogDraft {
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
          : [createEmptyVariant(0)],
    };
  }

  async function openProduct(productId: string) {
    setOpeningProductId(productId);
    const localProduct = products.find((product) => product.id === productId);
    if (localProduct) {
      setEditingProductId(productId);
      setEditingProduct(applyProductToDraft(localProduct));
      setEditCurrentStep("COMPOSE");
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
      setEditCurrentStep("COMPOSE");
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
      status: createSubmitIntent === "publish" ? "ACTIVE" : "DRAFT",
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
        const hint = readValidationStepHint(draftCheckData, "Failed to validate product draft.");
        if (hint) {
          setCreateCurrentStep(hint.step);
        }
        setStatusText(readValidationMessage(draftCheckData, "Failed to validate product draft."));
        return;
      }
      if (!draftCheckData.valid || draftCheckData.issues?.length > 0) {
        const hint = readValidationStepHint(
          draftCheckData,
          "Fix draft issues before creating this product."
        );
        if (hint) {
          setCreateCurrentStep(hint.step);
          setStatusText(hint.message);
          return;
        }
        setStatusText("Fix draft issues before creating this product.");
        return;
      }

      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const hint = readValidationStepHint(data, "Failed to create product.");
        if (hint) {
          setCreateCurrentStep(hint.step);
        }
        setStatusText(readValidationMessage(data, "Failed to create product."));
        return;
      }

      setStatusText(
        createSubmitIntent === "publish"
          ? `Created and published product ${data.product.name}.`
          : `Created draft product ${data.product.name}.`
      );
      setCreateDraft(createInitialCatalogDraft(categoryFallbackId));
      setCreateCurrentStep("COMPOSE");
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
      status: editSubmitIntent === "publish" ? "ACTIVE" : "DRAFT",
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
        inventory: variant.inventory ?? 0,
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
        const hint = readValidationStepHint(draftCheckData, "Failed to validate product draft.");
        if (hint) {
          setEditCurrentStep(hint.step);
        }
        setStatusText(readValidationMessage(draftCheckData, "Failed to validate product draft."));
        return;
      }
      if (!draftCheckData.valid || draftCheckData.issues?.length > 0) {
        const hint = readValidationStepHint(
          draftCheckData,
          "Fix draft issues before saving this product."
        );
        if (hint) {
          setEditCurrentStep(hint.step);
          setStatusText(hint.message);
          return;
        }
        setStatusText("Fix draft issues before saving this product.");
        return;
      }

      const response = await fetch(`/api/admin/catalog/${editingProductId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const hint = readValidationStepHint(data, "Failed to update product.");
        if (hint) {
          setEditCurrentStep(hint.step);
        }
        setStatusText(readValidationMessage(data, "Failed to update product."));
        return;
      }

      setStatusText(
        editSubmitIntent === "publish"
          ? `Updated and published product ${data.product.name}.`
          : `Saved draft for ${data.product.name}.`
      );
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
        target[key] = Math.max(0, toInt(value, 0));
      } else if (typeof value === "string") {
        (target as Record<string, string | number | boolean | undefined | null>)[key] = value;
      }

      variants[index] = target;
      next.variants = variants;
      return next;
    });
  }

  async function uploadImage(
    file: File,
    mode: "create" | "edit",
    onProgress: (progressPct: number) => void
  ) {
    if (mode === "edit" && !editingProduct) {
      return;
    }
    try {
      onProgress(5);
      const signResponse = await fetch("/api/admin/catalog/upload-image/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const signData = await signResponse.json();
      if (!signResponse.ok || !signData.ok) {
        setStatusText(readValidationMessage(signData, "Failed to prepare upload."));
        throw new Error("SIGN_UPLOAD_FAILED");
      }

      const uploadUrl = signData.uploadUrl as string;
      const publicUrl = signData.publicUrl as string;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total <= 0) {
            return;
          }

          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.max(5, Math.min(percent, 98)));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve();
            return;
          }

          reject(new Error(`UPLOAD_FAILED_${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error("UPLOAD_NETWORK_ERROR"));
        xhr.send(file);
      });

      const setter = mode === "create" ? setCreateDraftSafe : setEditingDraftSafe;
      setter((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: publicUrl,
            alt: "",
            variantId: null,
            sortOrder: prev.images.length,
          },
        ],
      }));

      setStatusText("Image uploaded to R2.");
    } catch (error) {
      try {
        // Fallback path for environments where direct browser upload is blocked (usually CORS).
        const formData = new FormData();
        formData.set("file", file);
        const fallbackResponse = await fetch("/api/admin/catalog/upload-image", {
          method: "POST",
          body: formData,
        });
        const fallbackData = await fallbackResponse.json();
        if (!fallbackResponse.ok || !fallbackData.ok) {
          setStatusText(readValidationMessage(fallbackData, "Failed to upload image."));
          throw error;
        }

        const setter = mode === "create" ? setCreateDraftSafe : setEditingDraftSafe;
        setter((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              url: fallbackData.url as string,
              alt: "",
              variantId: null,
              sortOrder: prev.images.length,
            },
          ],
        }));

        onProgress(100);
        setStatusText("Image uploaded to R2.");
      } catch {
        setStatusText("Unexpected error while uploading image.");
        throw error;
      }
    }
  }

  return (
    <main className="w-full space-y-6">
      {showProductList ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-semibold text-ink">Catalog</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/catalog/new" className="btn-primary">
              Create Product
            </Link>
          </div>
        </div>
      ) : null}

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
          {showProductList ? (
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
          ) : null}

          {showCreateForm ? (
            <CatalogEditorForm
              title="Create Product"
              draft={createDraft}
              draftIdentity="create"
              currentStep={createCurrentStep}
              onCurrentStepChange={setCreateCurrentStep}
              categories={categories}
              onCategoryCreated={onCategoryCreated}
              onDraftChange={setCreateDraftSafe}
              onImageChange={(index, key, value) =>
                updateDraftImage(setCreateDraftSafe, index, key, value)
              }
              onVariantChange={(index, key, value) =>
                updateDraftVariant(setCreateDraftSafe, index, key, value)
              }
              onUploadImage={(file, onProgress) => uploadImage(file, "create", onProgress)}
              mode="create"
              onSubmit={submitCreate}
              submitting={creating}
              submitIntent={createSubmitIntent}
              onSubmitIntentChange={setCreateSubmitIntent}
            />
          ) : null}

          {showProductList && editingProduct && editingProductId ? (
            <section className="space-y-4">
              <CatalogEditorForm
                title="Edit Product"
                subtitle={`Product ID: ${editingProductId}`}
                draft={editingProduct}
                draftIdentity={editingProductId}
                currentStep={editCurrentStep}
                onCurrentStepChange={setEditCurrentStep}
                categories={categories}
                onCategoryCreated={onCategoryCreated}
                onDraftChange={setEditingDraftSafe}
                onImageChange={(index, key, value) =>
                  updateDraftImage(setEditingDraftSafe, index, key, value)
                }
                onVariantChange={(index, key, value) =>
                  updateDraftVariant(setEditingDraftSafe, index, key, value)
                }
                onUploadImage={(file, onProgress) => uploadImage(file, "edit", onProgress)}
                mode="edit"
                onSubmit={submitUpdate}
                submitting={updating}
                submitIntent={editSubmitIntent}
                onSubmitIntentChange={setEditSubmitIntent}
                onClose={() => {
                  setEditingProduct(null);
                  setEditingProductId(null);
                }}
              />
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
  draftIdentity,
  currentStep,
  onCurrentStepChange,
  categories,
  onCategoryCreated,
  onDraftChange,
  onImageChange,
  onVariantChange,
  onUploadImage,
  mode,
}: {
  draft: CatalogDraft;
  draftIdentity: string;
  currentStep: CatalogEditorStepId;
  onCurrentStepChange: (step: CatalogEditorStepId) => void;
  categories: CategoryItem[];
  onCategoryCreated: (category: CategoryItem) => void;
  onDraftChange: DraftSetter;
  onImageChange: (index: number, key: keyof ProductImageItem, value: string) => void;
  onVariantChange: (
    index: number,
    key: keyof ProductVariantItem,
    value: string | boolean
  ) => void;
  onUploadImage: (file: File, onProgress: (progressPct: number) => void) => Promise<void>;
  mode: "create" | "edit";
}) {
  const sizePresetOptions = ["XS", "S", "M", "L", "XL", "XXL"];
  const colorPresetOptions = [
    { label: "Black", hex: "#1f1b17" },
    { label: "White", hex: "#f4f1eb" },
    { label: "Blue", hex: "#3f5f8a" },
    { label: "Red", hex: "#9f3b33" },
    { label: "Pink", hex: "#ca8d93" },
    { label: "Sand", hex: "#ccb08a" },
  ];
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isQueueUploading, setIsQueueUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState("");
  const initialDraftSignatureRef = useRef("");
  const draftIdentityRef = useRef("");
  const variantDiagnostics = useMemo(() => buildVariantDiagnostics(draft.variants), [draft.variants]);
  const variantBlockingCount = useMemo(
    () => draft.variants.reduce((count, _, index) => count + ((variantDiagnostics.issuesByIndex[index]?.length ?? 0) > 0 ? 1 : 0), 0),
    [draft.variants, variantDiagnostics.issuesByIndex]
  );
  const selectedVariantsWithStock = useMemo(() => {
    const selected = new Set(selectedVariantIndexes);
    return draft.variants.reduce((count, variant, index) => {
      if (!selected.has(index)) {
        return count;
      }
      return count + ((variant.inventory ?? 0) > 0 ? 1 : 0);
    }, 0);
  }, [draft.variants, selectedVariantIndexes]);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const isDirty = initialDraftSignatureRef.current !== "" && draftSignature !== initialDraftSignatureRef.current;

  useEffect(() => {
    if (draftIdentityRef.current === draftIdentity) {
      return;
    }

    draftIdentityRef.current = draftIdentity;
    initialDraftSignatureRef.current = draftSignature;
    onCurrentStepChange("COMPOSE");
  }, [draftIdentity, draftSignature, onCurrentStepChange]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const generatedSlug = slugifyCatalogValue(draft.name);
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
    const slug = slugifyCatalogValue(name);

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

  function queueFilesForUpload(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const queuedItems: UploadQueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued",
      progressPct: 0,
    }));

    setUploadQueue((prev) => [...queuedItems, ...prev].slice(0, 20));
    void processUploadQueue(queuedItems);
  }

  async function processUploadQueue(items: UploadQueueItem[]) {
    if (items.length === 0) {
      return;
    }

    setIsQueueUploading(true);

    for (const item of items) {
      setUploadQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "uploading", progressPct: 0, error: undefined }
            : entry
        )
      );

      try {
        await onUploadImage(item.file, (progressPct) => {
          setUploadQueue((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    status: "uploading",
                    progressPct,
                    error: undefined,
                  }
                : entry
            )
          );
        });
        setUploadQueue((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: "done", progressPct: 100 } : entry
          )
        );
      } catch (error) {
        setUploadQueue((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: "failed",
                  progressPct: 100,
                  error: mapUploadErrorMessage(error),
                }
              : entry
          )
        );
      }
    }

    setIsQueueUploading(false);
  }

  function retryUploadItem(itemId: string) {
    const item = uploadQueue.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    setUploadQueue((prev) =>
      prev.map((entry) =>
        entry.id === itemId ? { ...entry, status: "queued", progressPct: 0, error: undefined } : entry
      )
    );
    void processUploadQueue([{ ...item, status: "queued", progressPct: 0, error: undefined }]);
  }

  function handleImageInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    queueFilesForUpload(files);
    event.target.value = "";
  }

  function removeUploadQueueItem(itemId: string) {
    setUploadQueue((prev) => prev.filter((item) => item.id !== itemId));
  }

  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const imageDndIds = useMemo(
    () => draft.images.map((_, imageIndex) => `image-row-${imageIndex}`),
    [draft.images]
  );

  const reorderImageDraft = useCallback(
    (fromIndex: number, toIndex: number) => {
      onDraftChange((prev) => ({
        ...prev,
        images: reorderImages(prev.images, fromIndex, toIndex),
      }));
    },
    [onDraftChange]
  );

  const handleImageDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (isQueueUploading) {
        return;
      }

      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const fromIndex = imageDndIds.indexOf(String(active.id));
      const toIndex = imageDndIds.indexOf(String(over.id));
      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      reorderImageDraft(fromIndex, toIndex);
    },
    [imageDndIds, isQueueUploading, reorderImageDraft]
  );

  const removeImageRow = useCallback(
    (imageIndex: number) => {
      onDraftChange((prev) =>
        prev.images.length > 1
          ? {
              ...prev,
              images: normalizeImageSortOrder(
                prev.images.filter((_, itemIndex) => itemIndex !== imageIndex)
              ),
            }
          : prev
      );
    },
    [onDraftChange]
  );

  const assignableVariantOptions = useMemo(
    () =>
      draft.variants
        .filter((variant): variant is ProductVariantItem & { id: string } => Boolean(variant.id))
        .map((variant) => ({
          id: variant.id,
          label:
            `${variant.sku} ${variant.color ? `(${variant.color}` : ""} ` +
            `${variant.size ? `${variant.color ? "/" : "("}${variant.size}` : ""}` +
            `${variant.color || variant.size ? ")" : ""}`,
        })),
    [draft.variants]
  );

  const completedUploadCount = uploadQueue.filter(
    (item) => item.status === "done" || item.status === "failed"
  ).length;
  const overallUploadProgress =
    uploadQueue.length > 0
      ? Math.round((completedUploadCount / uploadQueue.length) * 100)
      : 0;

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
          inventory: shouldUpdateInventory ? Math.max(0, inventoryValue) : variant.inventory,
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
        variants: filtered.length > 0 ? filtered : [createEmptyVariant(0)],
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

  function toggleMatrixValue(
    rawValue: string,
    setter: (value: string) => void,
    target: string
  ) {
    const list = parseListInput(rawValue);
    const targetKey = target.toLowerCase();
    const next = list.some((item) => item.toLowerCase() === targetKey)
      ? list.filter((item) => item.toLowerCase() !== targetKey)
      : [...list, target];
    setter(next.join(", "));
  }

  function addMatrixValue(
    rawValue: string,
    setter: (value: string) => void,
    target: string
  ) {
    const normalized = target.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }
    const list = parseListInput(rawValue);
    if (list.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return;
    }
    setter([...list, normalized].join(", "));
  }

  function resolveColorSwatchHex(colorLabel: string): string {
    const label = colorLabel.trim();
    const preset = colorPresetOptions.find(
      (item) => item.label.toLowerCase() === label.toLowerCase()
    );
    if (preset) {
      return preset.hex;
    }

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(label)) {
      return label;
    }

    return "#8d8070";
  }

  function getBasicInfoErrors() {
    return {
      name: draft.name.trim().length === 0 ? "Product name is required." : "",
      slug:
        draft.slug.trim().length === 0
          ? "Product name must include letters or numbers."
          : "",
      price: draft.price.trim().length === 0 ? "Base price is required." : "",
      category: draft.categoryId.trim().length === 0 ? "Category is required." : "",
    };
  }

  function validateStep(step: CatalogEditorStepId): string | null {
    if (step === "COMPOSE") {
      const errors = getBasicInfoErrors();
      if (errors.name) return errors.name;
      if (errors.slug) return errors.slug;
      if (errors.price) return errors.price;
      if (errors.category) return errors.category;
      const hasImage = draft.images.some((image) => image.url.trim().length > 0);
      if (!hasImage) return "Add at least one image URL or upload an image.";
    }

    if (step === "GENERATE") {
      if (variantDiagnostics.hasBlocking) {
        return `Resolve variant warnings before moving to review (${variantBlockingCount} variant${variantBlockingCount === 1 ? "" : "s"} affected).`;
      }
    }

    return null;
  }

  const basicInfoErrors = getBasicInfoErrors();
  const showBasicInfoErrors = currentStep === "COMPOSE";
  const previewImage = draft.images.find((image) => image.url.trim().length > 0);
  const selectedComposeSizes = parseListInput(matrixSizes);
  const selectedComposeColors = parseListInput(matrixColors);
  const composedSizes =
    selectedComposeSizes.length > 0
      ? selectedComposeSizes
      : [...new Set(draft.variants.map((variant) => variant.size?.trim()).filter(Boolean))];
  const composedColors =
    selectedComposeColors.length > 0
      ? selectedComposeColors
      : [...new Set(draft.variants.map((variant) => variant.color?.trim()).filter(Boolean))];
  const composeSizeOptions = [
    ...sizePresetOptions,
    ...selectedComposeSizes.filter(
      (size) =>
        !sizePresetOptions.some((preset) => preset.toLowerCase() === size.toLowerCase())
    ),
  ];
  const composeColorOptions = [
    ...colorPresetOptions.map((color) => color.label),
    ...selectedComposeColors.filter(
      (color) =>
        !colorPresetOptions.some((preset) => preset.label.toLowerCase() === color.toLowerCase())
    ),
  ];

  return (
    <AdminWizardShell
      steps={catalogEditorStepRegistry.map((step) => ({ id: step.id, label: step.label }))}
      currentStep={currentStep}
      onStepChange={onCurrentStepChange}
      validateStep={validateStep}
      isDirty={isDirty}
    >
      <div className={currentStep === "COMPOSE" ? "space-y-4" : "hidden"}>
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <CreateProductPreviewCard
            imageUrl={previewImage?.url}
            imageAlt={previewImage?.alt ?? undefined}
            name={draft.name}
            priceLabel={`${draft.currency} ${draft.price || "0"}`}
            sizeSummary={`Sizes: ${composedSizes.length > 0 ? composedSizes.join(", ") : "Not selected"}`}
            colorSummary={`Colors: ${composedColors.length > 0 ? composedColors.join(", ") : "Not selected"}`}
            footerAction={
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => onCurrentStepChange("GENERATE")}
              >
                Next
              </button>
            }
          />
        </aside>
        <div className="space-y-5">
      <CreateProductSectionCard
        title="Basic Information"
        subtitle="Start with essentials, then move to generated variants."
        hint={
          mode === "create"
            ? "URL slug is auto-generated from product name. Variant image mapping unlocks after first save."
            : undefined
        }
      >
        <div className="grid gap-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.08em] text-charcoal">Product Name</label>
            <input
              value={draft.name}
              onChange={(event) => {
                const nextName = event.target.value;
                onDraftChange((prev) => ({ ...prev, name: nextName }));
              }}
              placeholder="e.g. Midnight Bloom Blazer Set"
              className={`rounded-md border bg-paper-light px-3 py-2 ${
                showBasicInfoErrors && basicInfoErrors.name
                  ? "border-seal-wax/80"
                  : "border-sepia-border"
              }`}
            />
            {showBasicInfoErrors && basicInfoErrors.name ? (
              <p className="text-xs text-seal-wax">{basicInfoErrors.name}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-[0.08em] text-charcoal">
              Description (Optional)
            </label>
            <textarea
              value={draft.description}
              onChange={(event) =>
                onDraftChange((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Short description shown on product detail page."
              className="min-h-24 w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2"
            />
          </div>

                <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-charcoal">Base Price</label>
              <input
                value={draft.price}
                onChange={(event) =>
                  onDraftChange((prev) => ({ ...prev, price: event.target.value }))
                }
                placeholder="e.g. 55000"
                className={`w-full rounded-md border bg-paper-light px-3 py-2 ${
                  showBasicInfoErrors && basicInfoErrors.price
                    ? "border-seal-wax/80"
                    : "border-sepia-border"
                }`}
              />
              {showBasicInfoErrors && basicInfoErrors.price ? (
                <p className="text-xs text-seal-wax">{basicInfoErrors.price}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-charcoal">Currency</label>
              <input
                value={draft.currency}
                onChange={(event) =>
                  onDraftChange((prev) => ({ ...prev, currency: event.target.value }))
                }
                placeholder="MMK"
                className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-charcoal">Status</label>
              <select
                value={draft.status}
                onChange={(event) =>
                  onDraftChange((prev) => ({ ...prev, status: event.target.value as ProductStatus }))
                }
                className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.08em] text-charcoal">Category</label>
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
                className={`w-full rounded-md border bg-paper-light px-3 py-2 ${
                  showBasicInfoErrors && basicInfoErrors.category
                    ? "border-seal-wax/80"
                    : "border-sepia-border"
                }`}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="__create__">+ Create category</option>
              </select>
              {showBasicInfoErrors && basicInfoErrors.category ? (
                <p className="text-xs text-seal-wax">{basicInfoErrors.category}</p>
              ) : null}
            </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {composeSizeOptions.map((sizeOption) => {
                        const isActive = selectedComposeSizes.some(
                          (item) => item.toLowerCase() === sizeOption.toLowerCase()
                        );
                        return (
                          <button
                            key={sizeOption}
                            type="button"
                            className={`rounded border px-3 py-1 text-xs ${
                              isActive
                                ? "border-antique-brass bg-antique-brass/15 text-ink"
                                : "border-sepia-border bg-paper-light text-charcoal"
                            }`}
                            onClick={() =>
                              toggleMatrixValue(matrixSizes, setMatrixSizes, sizeOption)
                            }
                          >
                            {sizeOption}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={customSizeInput}
                        onChange={(event) => setCustomSizeInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addMatrixValue(matrixSizes, setMatrixSizes, customSizeInput);
                            setCustomSizeInput("");
                          }
                        }}
                        placeholder="Add custom size (e.g. 3XL)"
                        className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        className="btn-secondary whitespace-nowrap"
                        onClick={() => {
                          addMatrixValue(matrixSizes, setMatrixSizes, customSizeInput);
                          setCustomSizeInput("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {composeColorOptions.map((colorOption) => {
                        const isActive = selectedComposeColors.some(
                          (item) => item.toLowerCase() === colorOption.toLowerCase()
                        );
                        return (
                          <button
                            key={colorOption}
                            type="button"
                            title={colorOption}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                              isActive ? "border-ink" : "border-sepia-border"
                            }`}
                            onClick={() =>
                              toggleMatrixValue(matrixColors, setMatrixColors, colorOption)
                            }
                          >
                            <span
                              className="h-5 w-5 rounded-full border border-ink/15"
                              style={{ backgroundColor: resolveColorSwatchHex(colorOption) }}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={customColorInput}
                        onChange={(event) => setCustomColorInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addMatrixValue(matrixColors, setMatrixColors, customColorInput);
                            setCustomColorInput("");
                          }
                        }}
                        placeholder="Add custom color (e.g. Mint or #98d8c8)"
                        className="w-full rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        className="btn-secondary whitespace-nowrap"
                        onClick={() => {
                          addMatrixValue(matrixColors, setMatrixColors, customColorInput);
                          setCustomColorInput("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {showBasicInfoErrors && basicInfoErrors.slug ? (
                  <p className="text-xs text-seal-wax">{basicInfoErrors.slug}</p>
                ) : null}
        </div>
      </CreateProductSectionCard>

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
      <div
        className={`${currentStep === "COMPOSE" ? "space-y-3 rounded-xl border border-sepia-border bg-paper-light/70 p-5 shadow-[0_1px_0_rgba(54,41,29,0.04)]" : "hidden"}`}
      >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-charcoal">Images</h3>
              <div className="flex flex-wrap items-center gap-2">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                multiple
                onChange={handleImageInputChange}
                className="hidden"
              />
              <button
                type="button"
                className="btn-secondary"
                disabled={isQueueUploading}
                onClick={() => imageFileInputRef.current?.click()}
              >
                Select Files
              </button>
            </div>
          </div>

          <div
            className={`rounded-lg border border-dashed p-6 text-sm transition-colors ${
              isDragOver ? "border-antique-brass bg-antique-brass/10" : "border-sepia-border bg-paper-light/40"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragOver(false);
              const files = Array.from(event.dataTransfer.files ?? []);
              queueFilesForUpload(files);
            }}
          >
            <p className="text-center font-medium text-ink">Drop your images here, or click to browse</p>
            <p className="text-center text-xs text-charcoal">
              JPG, PNG, WEBP, AVIF up to 8 MB. Multiple files supported.
            </p>
            <p className="mt-1 text-center text-xs text-charcoal/80">
              Tip: use &quot;Make Primary&quot; to pin the first image shown in listings and product
              pages.
            </p>
          </div>

          {uploadQueue.length > 0 ? (
            <div className="rounded-md border border-sepia-border/70 bg-paper-light/30 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-charcoal">
                <span>
                  Uploads: {completedUploadCount}/{uploadQueue.length}
                </span>
                <span>{isQueueUploading ? "Uploading..." : "Idle"}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-sepia-border/40">
                <div
                  className="h-full bg-antique-brass transition-all"
                  style={{ width: `${overallUploadProgress}%` }}
                />
              </div>
              <div className="mt-3 space-y-2">
                {uploadQueue.map((item) => {
                  const barWidth = Math.max(4, item.progressPct);

                  return (
                    <div key={item.id} className="rounded border border-sepia-border/60 bg-parchment p-2">
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <p className="truncate text-charcoal">
                          {item.file.name} ({formatFileSize(item.file.size)})
                        </p>
                        <p className="uppercase tracking-wide text-charcoal">{item.status}</p>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded bg-sepia-border/40">
                        <div
                          className={`h-full transition-all ${
                            item.status === "failed" ? "bg-seal-wax" : "bg-antique-brass"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      {item.error ? <p className="mt-1 text-xs text-seal-wax">{item.error}</p> : null}
                      <div className="mt-2 flex gap-2">
                        {item.status === "failed" ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => retryUploadItem(item.id)}
                          >
                            Retry
                          </button>
                        ) : null}
                        {item.status !== "uploading" ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => removeUploadQueueItem(item.id)}
                          >
                            Dismiss
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleImageDragEnd}
        >
          <SortableContext items={imageDndIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {draft.images.map((image, index) => (
                <SortableImageRow
                  key={imageDndIds[index]}
                  dndId={imageDndIds[index]}
                  index={index}
                  image={image}
                  totalImages={draft.images.length}
                  isQueueUploading={isQueueUploading}
                  variantOptions={assignableVariantOptions}
                  onImageChange={onImageChange}
                  onRemove={removeImageRow}
                  onMoveUp={(imageIndex) => reorderImageDraft(imageIndex, imageIndex - 1)}
                  onMoveDown={(imageIndex) => reorderImageDraft(imageIndex, imageIndex + 1)}
                  onMakePrimary={(imageIndex) => reorderImageDraft(imageIndex, 0)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
        </div>
      </div>
      </div>

      <section className={`${currentStep === "GENERATE" ? "space-y-4" : "hidden"}`}>
  <div className="rounded-md border border-sepia-border p-4">
    <h3 className="text-sm font-semibold text-ink">Variant Matrix Generator</h3>
    <p className="mt-1 text-xs text-charcoal">
      Generate color x size combinations and append only missing variants.
    </p>
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
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
    {presetFeedback ? <p className="mt-2 text-xs text-charcoal">{presetFeedback}</p> : null}
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void generateVariantsFromMatrix()}
        disabled={generatingMatrix}
        className="btn-secondary disabled:opacity-60"
      >
        {generatingMatrix ? "Generating..." : "Generate Missing Variants"}
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() =>
          onDraftChange((prev) => ({
            ...prev,
            variants: [...prev.variants, createEmptyVariant(prev.variants.length)],
          }))
        }
      >
        Add Variant
      </button>
      {matrixFeedback ? <p className="text-xs text-charcoal">{matrixFeedback}</p> : null}
    </div>
  </div>

  <div className="rounded-md border border-sepia-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold text-ink">Generated Variants</h3>
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
          disabled={selectedVariantIndexes.length === 0}
          onClick={() => setSelectedVariantIndexes([])}
        >
          Clear
        </button>
      </div>
    </div>

    <div className="mt-3 rounded border border-sepia-border/60 bg-paper-light/40 px-3 py-2">
      <p className="text-xs text-charcoal">
        {selectedVariantIndexes.length} selected
        {selectedVariantIndexes.length > 0 && selectedVariantsWithStock > 0
          ? ` | ${selectedVariantsWithStock} with stock`
          : ""}
      </p>
      {variantDiagnostics.hasBlocking ? (
        <p className="mt-1 text-xs text-seal-wax">
          {variantBlockingCount} variant{variantBlockingCount === 1 ? "" : "s"} need fixes
          before Review.
        </p>
      ) : null}
    </div>

    <div className="mt-3 space-y-2 rounded-md border border-sepia-border/70 p-3">
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
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
          placeholder="Inventory"
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
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={applyBulkVariantFields}
          disabled={selectedVariantIndexes.length === 0}
        >
          Apply Bulk Changes
        </button>
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={autofillSelectedVariantIdentity}
          disabled={selectedVariantIndexes.length === 0}
        >
          Auto-fill Name/SKU
        </button>
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={duplicateSelectedVariants}
          disabled={selectedVariantIndexes.length === 0}
        >
          Duplicate Selected
        </button>
        <button type="button" className="btn-secondary" onClick={normalizeVariantSortOrder}>
          Normalize Sort Order
        </button>
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={removeSelectedVariants}
          disabled={selectedVariantIndexes.length === 0}
        >
          Remove Selected
        </button>
        {bulkFeedback ? <p className="text-xs text-charcoal">{bulkFeedback}</p> : null}
      </div>
    </div>

    <div className="mt-3 hidden overflow-x-auto rounded-md border border-sepia-border/70 lg:block">
      <table className="min-w-full divide-y divide-sepia-border/70 text-sm text-ink">
        <thead className="bg-paper-light/40 text-xs uppercase tracking-[0.08em] text-charcoal">
          <tr>
            <th className="px-3 py-2 text-left">Sel</th>
            <th className="px-3 py-2 text-left">SKU</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Color</th>
            <th className="px-3 py-2 text-left">Size</th>
            <th className="px-3 py-2 text-left">Price</th>
            <th className="px-3 py-2 text-left">Inventory</th>
            <th className="px-3 py-2 text-left">Active</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sepia-border/60">
          {draft.variants.map((variant, index) => (
            <tr key={`variant-row-${variant.id ?? index}`}>
              <td className="px-3 py-2">
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
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  value={variant.sku}
                  onChange={(event) => onVariantChange(index, "sku", event.target.value)}
                  placeholder="SKU"
                  className="w-44 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  value={variant.name}
                  onChange={(event) => onVariantChange(index, "name", event.target.value)}
                  placeholder="Variant name"
                  className="w-48 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  value={variant.color ?? ""}
                  onChange={(event) => onVariantChange(index, "color", event.target.value)}
                  placeholder="Color"
                  className="w-24 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  value={variant.size ?? ""}
                  onChange={(event) => onVariantChange(index, "size", event.target.value)}
                  placeholder="Size"
                  className="w-20 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  value={variant.price ?? ""}
                  onChange={(event) => onVariantChange(index, "price", event.target.value)}
                  placeholder="Price"
                  className="w-24 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <input
                  type="number"
                  value={variant.inventory ?? 0}
                  onChange={(event) => onVariantChange(index, "inventory", event.target.value)}
                  placeholder="Inventory"
                  className="w-24 rounded-md border border-sepia-border bg-paper-light px-2 py-1 text-xs"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(event) => onVariantChange(index, "isActive", event.target.checked)}
                />
              </td>
              <td className="px-3 py-2 text-right align-top">
                <button
                  type="button"
                  className="btn-secondary text-xs"
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
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-3 space-y-3 lg:hidden">
      {draft.variants.map((variant, index) => (
        <div
          key={`variant-card-${variant.id ?? index}`}
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
            <input
              type="number"
              value={variant.inventory ?? 0}
              onChange={(event) => onVariantChange(index, "inventory", event.target.value)}
              placeholder="Inventory"
              className="rounded-md border border-sepia-border bg-paper-light px-3 py-2 text-sm"
            />
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
  </div>
</section>
<section className={`${currentStep === "REVIEW" ? "space-y-3" : "hidden"} rounded-md border border-sepia-border p-4`}>
        <h3 className="text-lg font-semibold text-ink">Review Before Save</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <section className="rounded border border-sepia-border/70 bg-paper-light/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Basic Info</p>
              <button type="button" className="btn-secondary" onClick={() => onCurrentStepChange("COMPOSE")}>
                Jump to fix
              </button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-charcoal">
              <p><span className="font-semibold text-ink">Name:</span> {draft.name || "-"}</p>
              <p>
                <span className="font-semibold text-ink">Category:</span>{" "}
                {categories.find((item) => item.id === draft.categoryId)?.name ?? "-"}
              </p>
              <p><span className="font-semibold text-ink">Base Price:</span> {draft.price || "-"} {draft.currency}</p>
            </div>
          </section>
          <section className="rounded border border-sepia-border/70 bg-paper-light/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Media</p>
              <button type="button" className="btn-secondary" onClick={() => onCurrentStepChange("COMPOSE")}>
                Jump to fix
              </button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-charcoal">
              <p><span className="font-semibold text-ink">Images:</span> {draft.images.filter((image) => image.url.trim()).length}</p>
              <p><span className="font-semibold text-ink">Primary:</span> {draft.images[0]?.url?.trim() ? "Set" : "Missing"}</p>
            </div>
          </section>
          <section className="rounded border border-sepia-border/70 bg-paper-light/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.08em] text-charcoal">Variants</p>
              <button type="button" className="btn-secondary" onClick={() => onCurrentStepChange("GENERATE")}>
                Jump to fix
              </button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-charcoal">
              <p><span className="font-semibold text-ink">Variants:</span> {draft.variants.length}</p>
              <p><span className="font-semibold text-ink">Active:</span> {draft.variants.filter((variant) => variant.isActive).length}</p>
              <p><span className="font-semibold text-ink">New:</span> {draft.variants.filter((variant) => !variant.id).length}</p>
              <p><span className="font-semibold text-ink">Needs Fix:</span> {variantBlockingCount}</p>
            </div>
          </section>
        </div>
        <p className="text-xs text-charcoal">
          Use Save Draft to keep work-in-progress, or Publish to set product status ACTIVE.
        </p>
      </section>

    </AdminWizardShell>
  );
}

