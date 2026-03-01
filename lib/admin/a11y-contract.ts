export const ADMIN_A11Y = {
  target: {
    minInteractive: "min-h-11 min-w-11",
    compactInteractive: "min-h-10 min-w-10",
  },
  focus: {
    ring: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass",
  },
  text: {
    label: "text-sm",
    helper: "text-sm",
    meta: "text-xs",
  },
} as const;

type LiveRegionTone = "polite" | "assertive";

export function adminLiveRegionProps(tone: LiveRegionTone = "polite") {
  return {
    role: tone === "assertive" ? ("alert" as const) : ("status" as const),
    "aria-live": tone,
    "aria-atomic": "true" as const,
  };
}

export type FieldA11yOptions = {
  fieldId: string;
  errorMessage?: string | null;
  describedById?: string;
};

export function adminFieldA11y({
  fieldId,
  errorMessage,
  describedById,
}: FieldA11yOptions): {
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  errorId: string;
} {
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(errorMessage && errorMessage.trim().length > 0);

  if (!hasError) {
    return {
      ...(describedById ? { "aria-describedby": describedById } : {}),
      errorId,
    };
  }

  const describedBy = describedById ? `${describedById} ${errorId}` : errorId;
  return {
    "aria-invalid": true,
    "aria-describedby": describedBy,
    errorId,
  };
}

