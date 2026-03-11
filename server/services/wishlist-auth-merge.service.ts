import { readWishlistGuestSession } from "@/lib/wishlist/guest-token";
import { resolveCustomerFromAuthUser } from "@/server/auth/customer-identity";
import { logWishlistAuthMergeFailure } from "@/server/observability/wishlist-events";
import { mergeGuestWishlistIntoCustomer } from "@/server/services/wishlist-write.service";

export type WishlistAuthMergeResult =
  | {
      status: "skipped";
      reasonCode: "NO_GUEST_TOKEN";
      customerId: null;
      mergedCount: 0;
    }
  | {
      status: "skipped";
      reasonCode: "NO_SESSION" | "AUTH_LOOKUP_FAILED" | "MISSING_EMAIL" | "IDENTITY_CONFLICT" | "CUSTOMER_LOOKUP_FAILED";
      customerId: null;
      mergedCount: 0;
    }
  | {
      status: "merged";
      reasonCode: "MERGED";
      customerId: string;
      mergedCount: number;
    }
  | {
      status: "failed";
      reasonCode: "MERGE_FAILED";
      customerId: string | null;
      mergedCount: 0;
    };

type MergeWishlistAfterCustomerAuthInput = {
  requestHeaders: Headers;
  requestId: string | null;
  authUserId: string;
  email: string | null | undefined;
};

function buildRequestFromHeaders(headers: Headers): Request {
  return new Request("http://localhost/account", {
    method: "POST",
    headers,
  });
}

export async function mergeWishlistAfterCustomerAuth(
  input: MergeWishlistAfterCustomerAuthInput
): Promise<WishlistAuthMergeResult> {
  const request = buildRequestFromHeaders(input.requestHeaders);
  const guestSession = readWishlistGuestSession(request);

  if (!guestSession) {
    return {
      status: "skipped",
      reasonCode: "NO_GUEST_TOKEN",
      customerId: null,
      mergedCount: 0,
    };
  }

  const customerIdentity = await resolveCustomerFromAuthUser({
    authUserId: input.authUserId,
    email: input.email,
    requestId: input.requestId,
  });

  if (customerIdentity.kind !== "customer") {
    logWishlistAuthMergeFailure({
      event: "wishlist.auth_merge.failed",
      requestId: input.requestId,
      customerId: null,
      reasonCode: customerIdentity.reason,
    });

    return {
      status: "skipped",
      reasonCode: customerIdentity.reason,
      customerId: null,
      mergedCount: 0,
    };
  }

  try {
    const result = await mergeGuestWishlistIntoCustomer({
      customerId: customerIdentity.customerId,
      guestTokenHash: guestSession.tokenHash,
    });

    return {
      status: "merged",
      reasonCode: "MERGED",
      customerId: customerIdentity.customerId,
      mergedCount: result.mergedCount,
    };
  } catch {
    logWishlistAuthMergeFailure({
      event: "wishlist.auth_merge.failed",
      requestId: input.requestId,
      customerId: customerIdentity.customerId,
      reasonCode: "MERGE_FAILED",
    });

    return {
      status: "failed",
      reasonCode: "MERGE_FAILED",
      customerId: customerIdentity.customerId,
      mergedCount: 0,
    };
  }
}
