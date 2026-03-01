import { createResourceCrudCopy } from "@/lib/admin/microcopy-contract";

export const ADMIN_SETTINGS_NAV_LINKS = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/shipping-rules", label: "Shipping Rules" },
  { href: "/admin/payment-transfer-methods", label: "Payment Methods" },
  { href: "/admin/catalog", label: "Catalog" },
] as const;

const SHIPPING_RULES_CRUD_COPY = createResourceCrudCopy({
  singular: "Rule",
  plural: "Rules",
  createVerb: "Create",
  editSectionVerb: "Edit",
  editSubmitVerb: "Save",
  createdVerbPast: "Created rule",
  updatedVerbPast: "Updated rule",
  deletedLabel: "Shipping rule deleted.",
  emptyStateText: "No shipping rules yet.",
});

export const SHIPPING_RULES_COPY = {
  pageTitle: "Shipping Rules",
  fallbackMissingWarning:
    "No active fallback rule found. Checkout will be blocked until fallback is active.",
  healthTitle: "Coverage Health",
  healthActiveRulesLabel: "Active rules",
  healthFallbackLabel: "Fallback",
  healthFallbackActive: "Active",
  healthFallbackMissing: "Missing",
  currentSectionTitle: SHIPPING_RULES_CRUD_COPY.sectionCurrent,
  createSectionTitle: SHIPPING_RULES_CRUD_COPY.sectionCreate,
  editSectionTitle: SHIPPING_RULES_CRUD_COPY.sectionEdit,
  loadingText: SHIPPING_RULES_CRUD_COPY.loadingText,
  emptyStateText: SHIPPING_RULES_CRUD_COPY.emptyStateText,
  closeEditorLabel: SHIPPING_RULES_CRUD_COPY.closeEditorLabel,
  createSuccess: (name: string) => `Created rule ${name}.`,
  updateSuccess: SHIPPING_RULES_CRUD_COPY.updateSuccess,
  deleteSuccess: SHIPPING_RULES_CRUD_COPY.deleteSuccess,
  loadFailed: SHIPPING_RULES_CRUD_COPY.loadFailed,
  createFailed: SHIPPING_RULES_CRUD_COPY.createFailed,
  updateFailed: SHIPPING_RULES_CRUD_COPY.updateFailed,
  deleteFailed: SHIPPING_RULES_CRUD_COPY.deleteFailed,
  loadUnexpected: SHIPPING_RULES_CRUD_COPY.loadUnexpected,
  createUnexpected: SHIPPING_RULES_CRUD_COPY.createUnexpected,
  updateUnexpected: SHIPPING_RULES_CRUD_COPY.updateUnexpected,
  deleteUnexpected: SHIPPING_RULES_CRUD_COPY.deleteUnexpected,
  form: {
    createSubmit: SHIPPING_RULES_CRUD_COPY.form.createSubmit,
    createSubmitting: SHIPPING_RULES_CRUD_COPY.form.createSubmitting,
    editSubmit: SHIPPING_RULES_CRUD_COPY.form.editSubmit,
    editSubmitting: SHIPPING_RULES_CRUD_COPY.form.editSubmitting,
  },
} as const;

const PAYMENT_METHODS_CRUD_COPY = createResourceCrudCopy({
  singular: "Method",
  plural: "Methods",
  createVerb: "Create",
  editSectionVerb: "Edit",
  editSubmitVerb: "Save",
  createdVerbPast: "Created",
  updatedVerbPast: "Updated",
  deletedLabel: "Payment transfer method deleted.",
  emptyStateText: "No payment transfer methods yet.",
});

export const PAYMENT_TRANSFER_METHODS_COPY = {
  pageTitle: "Payment Transfer Methods",
  activeCountLabel: (count: number) => `Active methods in checkout: ${count}`,
  activeCountWarning:
    "At least one active method is recommended so prepaid checkout remains available.",
  healthTitle: "Checkout Availability",
  healthActiveLabel: "Active methods",
  healthBankLabel: "Bank",
  healthWalletLabel: "Wallet",
  currentSectionTitle: PAYMENT_METHODS_CRUD_COPY.sectionCurrent,
  createSectionTitle: PAYMENT_METHODS_CRUD_COPY.sectionCreate,
  editSectionTitle: PAYMENT_METHODS_CRUD_COPY.sectionEdit,
  loadingText: PAYMENT_METHODS_CRUD_COPY.loadingText,
  emptyStateText: PAYMENT_METHODS_CRUD_COPY.emptyStateText,
  closeEditorLabel: PAYMENT_METHODS_CRUD_COPY.closeEditorLabel,
  createSuccess: (label: string) => `Created ${label}.`,
  updateSuccess: PAYMENT_METHODS_CRUD_COPY.updateSuccess,
  deleteSuccess: PAYMENT_METHODS_CRUD_COPY.deleteSuccess,
  loadFailed: PAYMENT_METHODS_CRUD_COPY.loadFailed,
  createFailed: PAYMENT_METHODS_CRUD_COPY.createFailed,
  updateFailed: PAYMENT_METHODS_CRUD_COPY.updateFailed,
  deleteFailed: PAYMENT_METHODS_CRUD_COPY.deleteFailed,
  loadUnexpected: PAYMENT_METHODS_CRUD_COPY.loadUnexpected,
  createUnexpected: PAYMENT_METHODS_CRUD_COPY.createUnexpected,
  updateUnexpected: PAYMENT_METHODS_CRUD_COPY.updateUnexpected,
  deleteUnexpected: PAYMENT_METHODS_CRUD_COPY.deleteUnexpected,
  form: {
    createSubmit: PAYMENT_METHODS_CRUD_COPY.form.createSubmit,
    createSubmitting: PAYMENT_METHODS_CRUD_COPY.form.createSubmitting,
    editSubmit: PAYMENT_METHODS_CRUD_COPY.form.editSubmit,
    editSubmitting: PAYMENT_METHODS_CRUD_COPY.form.editSubmitting,
  },
} as const;
