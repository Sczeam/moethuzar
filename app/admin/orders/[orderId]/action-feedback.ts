import { presentOrderActionError } from "@/lib/admin/error-presenter";

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

export function mapOrderActionError(payload: ApiErrorPayload): ActionFeedback {
  return presentOrderActionError(payload);
}
