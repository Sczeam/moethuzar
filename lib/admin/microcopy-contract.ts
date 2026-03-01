type ResourceCrudCopyOptions = {
  singular: string;
  plural: string;
  createVerb: string;
  editSectionVerb: string;
  editSubmitVerb: string;
  createdVerbPast: string;
  updatedVerbPast: string;
  deletedLabel: string;
  emptyStateText: string;
};

type ResourceCrudCopy = {
  sectionCurrent: string;
  sectionCreate: string;
  sectionEdit: string;
  emptyStateText: string;
  loadingText: string;
  closeEditorLabel: string;
  createSuccess: (name: string) => string;
  updateSuccess: (name: string) => string;
  deleteSuccess: string;
  loadFailed: string;
  createFailed: string;
  updateFailed: string;
  deleteFailed: string;
  loadUnexpected: string;
  createUnexpected: string;
  updateUnexpected: string;
  deleteUnexpected: string;
  form: {
    createSubmit: string;
    createSubmitting: string;
    editSubmit: string;
    editSubmitting: string;
  };
};

export const ADMIN_MICROCOPY = {
  labels: {
    active: "Active",
    inactive: "Inactive",
    fallback: "Fallback",
    warning: "Warnings",
  },
  actions: {
    create: "Create",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    closeEditor: "Close Editor",
    loading: "Loading...",
  },
  guidance: {
    retryAction: "Please retry.",
    unexpectedPrefix: "Unexpected error while",
    failedPrefix: "Failed to",
  },
} as const;

function toPresentParticiple(verb: string) {
  if (verb.endsWith("e")) {
    return `${verb.slice(0, -1)}ing`;
  }
  return `${verb}ing`;
}

export function createResourceCrudCopy(options: ResourceCrudCopyOptions): ResourceCrudCopy {
  const creatingLabel = toPresentParticiple(options.createVerb);
  const editingLabel = toPresentParticiple(options.editSubmitVerb);

  return {
    sectionCurrent: `Current ${options.plural}`,
    sectionCreate: `${options.createVerb} ${options.singular}`,
    sectionEdit: `${options.editSectionVerb} ${options.singular}`,
    emptyStateText: options.emptyStateText,
    loadingText: ADMIN_MICROCOPY.actions.loading,
    closeEditorLabel: ADMIN_MICROCOPY.actions.closeEditor,
    createSuccess: (name: string) => `${options.createdVerbPast} ${name}.`,
    updateSuccess: (name: string) => `${options.updatedVerbPast} ${name}.`,
    deleteSuccess: options.deletedLabel,
    loadFailed: `${ADMIN_MICROCOPY.guidance.failedPrefix} load ${options.plural.toLowerCase()}.`,
    createFailed: `${ADMIN_MICROCOPY.guidance.failedPrefix} ${options.createVerb.toLowerCase()} ${options.singular.toLowerCase()}.`,
    updateFailed: `${ADMIN_MICROCOPY.guidance.failedPrefix} ${options.editSubmitVerb.toLowerCase()} ${options.singular.toLowerCase()}.`,
    deleteFailed: `${ADMIN_MICROCOPY.guidance.failedPrefix} delete ${options.singular.toLowerCase()}.`,
    loadUnexpected: `${ADMIN_MICROCOPY.guidance.unexpectedPrefix} loading ${options.plural.toLowerCase()}.`,
    createUnexpected: `${ADMIN_MICROCOPY.guidance.unexpectedPrefix} ${creatingLabel} ${options.singular.toLowerCase()}.`,
    updateUnexpected: `${ADMIN_MICROCOPY.guidance.unexpectedPrefix} ${editingLabel} ${options.singular.toLowerCase()}.`,
    deleteUnexpected: `${ADMIN_MICROCOPY.guidance.unexpectedPrefix} deleting ${options.singular.toLowerCase()}.`,
    form: {
      createSubmit: `${options.createVerb} ${options.singular}`,
      createSubmitting: `${creatingLabel}...`,
      editSubmit: `${options.editSubmitVerb} ${options.singular}`,
      editSubmitting: `${editingLabel}...`,
    },
  };
}
