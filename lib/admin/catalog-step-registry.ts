export const catalogEditorSteps = ["BASICS", "IMAGES", "VARIANTS", "REVIEW"] as const;

export type CatalogEditorStepId = (typeof catalogEditorSteps)[number];

export type CatalogEditorStepMeta = {
  id: CatalogEditorStepId;
  label: string;
  order: number;
};

export const catalogEditorStepRegistry: readonly CatalogEditorStepMeta[] = [
  { id: "BASICS", label: "Basics", order: 0 },
  { id: "IMAGES", label: "Images", order: 1 },
  { id: "VARIANTS", label: "Variants", order: 2 },
  { id: "REVIEW", label: "Review", order: 3 },
] as const;

export function getCatalogEditorStepLabel(step: CatalogEditorStepId): string {
  return catalogEditorStepRegistry.find((item) => item.id === step)?.label ?? "Step";
}
