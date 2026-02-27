export const catalogEditorSteps = ["COMPOSE", "GENERATE", "REVIEW"] as const;

export type CatalogEditorStepId = (typeof catalogEditorSteps)[number];

export type CatalogEditorStepMeta = {
  id: CatalogEditorStepId;
  label: string;
  order: number;
};

export const catalogEditorStepRegistry: readonly CatalogEditorStepMeta[] = [
  { id: "COMPOSE", label: "Compose", order: 0 },
  { id: "GENERATE", label: "Generate Variants", order: 1 },
  { id: "REVIEW", label: "Review", order: 2 },
] as const;

export function getCatalogEditorStepLabel(step: CatalogEditorStepId): string {
  return catalogEditorStepRegistry.find((item) => item.id === step)?.label ?? "Step";
}
