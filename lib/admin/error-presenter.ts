type ApiIssue = {
  path?: unknown;
  message?: unknown;
};

type AdminApiErrorPayload = {
  code?: unknown;
  error?: unknown;
  requestId?: unknown;
  issues?: unknown;
};

type PresentAdminApiErrorOptions = {
  fallback: string;
  includeRequestId?: boolean;
  includeFirstIssue?: boolean;
};

type PresentedOrderActionError = {
  severity: "warning" | "error";
  message: string;
  staleState: boolean;
  retryable: boolean;
};

const ORDER_STALE_CODES = new Set([
  "INVALID_ORDER_STATUS_TRANSITION",
  "PAYMENT_REVIEW_NOT_PENDING",
  "PAYMENT_REVIEW_NOT_APPLICABLE",
  "PAYMENT_PROOF_MISSING",
]);

function toPayload(data: unknown): AdminApiErrorPayload | null {
  if (!data || typeof data !== "object") return null;
  return data as AdminApiErrorPayload;
}

function firstIssueText(issues: unknown): string | null {
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const first = issues[0] as ApiIssue;
  const path =
    Array.isArray(first.path) && first.path.length > 0
      ? first.path.map((part) => String(part)).join(".")
      : null;
  const message = typeof first.message === "string" ? first.message.trim() : "";
  if (!message.length) return null;
  return path ? `${path}: ${message}` : message;
}

function withRequestId(message: string, requestId: string | null, includeRequestId: boolean) {
  if (!includeRequestId || !requestId) return message;
  return `${message} (Request ID: ${requestId})`;
}

export function presentAdminApiError(
  data: unknown,
  options: PresentAdminApiErrorOptions,
): string {
  const payload = toPayload(data);
  if (!payload) return options.fallback;

  const code = typeof payload.code === "string" ? payload.code : null;
  const apiMessage = typeof payload.error === "string" ? payload.error.trim() : "";
  const requestId = typeof payload.requestId === "string" ? payload.requestId : null;

  if (options.includeFirstIssue) {
    const issueMessage = firstIssueText(payload.issues);
    if (issueMessage) {
      return withRequestId(issueMessage, requestId, options.includeRequestId ?? false);
    }
  }

  let message = options.fallback;

  switch (code) {
    case "CONFLICT":
      message = "A similar record already exists. Use different details or update the existing one.";
      break;
    case "VALIDATION_ERROR":
      message = apiMessage || "Some fields are invalid. Please update highlighted inputs and retry.";
      break;
    case "SCHEMA_NOT_SYNCED":
      message = "System update required. Please run latest migration, then retry.";
      break;
    case "UNAUTHORIZED":
      message = "Your session is not authenticated. Please sign in and retry.";
      break;
    case "FORBIDDEN":
      message = "You do not have permission to perform this action.";
      break;
    case "RATE_LIMITED":
      message = "Too many attempts. Please wait a moment and retry.";
      break;
    default:
      message = apiMessage || options.fallback;
      break;
  }

  return withRequestId(message, requestId, options.includeRequestId ?? false);
}

export function presentOrderActionError(data: unknown): PresentedOrderActionError {
  const payload = toPayload(data);
  const code = payload && typeof payload.code === "string" ? payload.code : null;

  if (code && ORDER_STALE_CODES.has(code)) {
    return {
      severity: "warning",
      message: "Order state changed. Latest order data has been loaded. Review actions again.",
      staleState: true,
      retryable: false,
    };
  }

  if (code === "VALIDATION_ERROR") {
    return {
      severity: "error",
      message: presentAdminApiError(payload, {
        fallback: "Invalid action request. Update fields and retry.",
        includeFirstIssue: true,
        includeRequestId: false,
      }),
      staleState: false,
      retryable: false,
    };
  }

  return {
    severity: "error",
    message: presentAdminApiError(payload, {
      fallback: "Unable to complete this action. Please retry.",
      includeRequestId: false,
      includeFirstIssue: false,
    }),
    staleState: false,
    retryable: true,
  };
}
