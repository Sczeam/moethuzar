import { logWarn } from "@/lib/observability";

type WishlistAuthMergeFailureEventInput = {
  event: string;
  requestId: string | null;
  customerId: string | null;
  reasonCode: string;
};

export function logWishlistAuthMergeFailure(input: WishlistAuthMergeFailureEventInput) {
  logWarn({
    event: input.event,
    requestId: input.requestId,
    customerId: input.customerId,
    reasonCode: input.reasonCode,
  });
}
