import { logWarn } from "@/lib/observability";

type AuthFailureEventInput = {
  event: string;
  requestId: string | null;
  reasonCode: string;
};

export function logAuthFailureEvent(input: AuthFailureEventInput) {
  logWarn({
    event: input.event,
    requestId: input.requestId,
    reasonCode: input.reasonCode,
  });
}

