type ApiErrorPayload = {
  code?: string;
  error?: string;
  requestId?: string;
};

export type ActionFeedbackSeverity = "success" | "warning" | "error";

export type ActionFeedback = {
  severity: ActionFeedbackSeverity;
  message: string;
  staleState: boolean;
  retryable: boolean;
};

const STALE_TRANSITION_CODES = new Set([
  "INVALID_ORDER_STATUS_TRANSITION",
  "PAYMENT_REVIEW_NOT_PENDING",
  "PAYMENT_REVIEW_NOT_APPLICABLE",
  "PAYMENT_PROOF_MISSING",
]);

export function mapOrderActionError(payload: ApiErrorPayload): ActionFeedback {
  if (payload.code && STALE_TRANSITION_CODES.has(payload.code)) {
    return {
      severity: "warning",
      message: "Order state changed. The latest order data has been loaded. Please review actions again.",
      staleState: true,
      retryable: false,
    };
  }

  if (payload.code === "VALIDATION_ERROR") {
    return {
      severity: "error",
      message: payload.error ?? "Invalid action request. Please update fields and retry.",
      staleState: false,
      retryable: false,
    };
  }

  return {
    severity: "error",
    message: payload.error ?? "Unable to complete this action. Please retry.",
    staleState: false,
    retryable: true,
  };
}
