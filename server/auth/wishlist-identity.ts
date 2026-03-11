import { logWarn } from "@/lib/observability";
import {
  readWishlistGuestSession,
  resolveWishlistGuestSession,
} from "@/lib/wishlist/guest-token";
import {
  resolveCustomerFromSession,
} from "@/server/auth/customer-identity";

type WishlistGuestReason =
  | "NO_SESSION"
  | "AUTH_LOOKUP_FAILED"
  | "MISSING_EMAIL"
  | "IDENTITY_CONFLICT"
  | "CUSTOMER_LOOKUP_FAILED";

export type ResolvedWishlistIdentity =
  | {
      kind: "customer";
      customerId: string;
      authUserId: string;
      email: string;
      guestSession: ReturnType<typeof resolveWishlistGuestSession> | null;
    }
  | {
      kind: "guest";
      customerId: null;
      authUserId: null;
      email: null;
      guestSession: ReturnType<typeof resolveWishlistGuestSession>;
      reason: WishlistGuestReason;
    };

export async function resolveWishlistIdentity(
  request: Request,
  input: { requestId?: string | null } = {}
): Promise<ResolvedWishlistIdentity> {
  const customerIdentity = await resolveCustomerFromSession({
    requestId: input.requestId ?? request.headers.get("x-request-id") ?? null,
  });

  if (customerIdentity.kind === "customer") {
    const guestSession = readWishlistGuestSession(request);
    return {
      kind: "customer",
      customerId: customerIdentity.customerId,
      authUserId: customerIdentity.authUserId,
      email: customerIdentity.email,
      guestSession,
    };
  }

  const guestSession = resolveWishlistGuestSession(request);
  if (guestSession.isNew) {
    logWarn({
      event: "wishlist_identity.guest_token_issued",
      requestId: input.requestId ?? request.headers.get("x-request-id") ?? null,
      reason: customerIdentity.reason,
    });
  }

  return {
    kind: "guest",
    customerId: null,
    authUserId: null,
    email: null,
    guestSession,
    reason: customerIdentity.reason,
  };
}
