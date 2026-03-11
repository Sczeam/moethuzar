"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type AccountLoginActionState } from "@/app/account/login/state";
import { isNextRedirectError } from "@/server/auth/action-errors";
import { mapAuthActionError } from "@/server/auth/auth-action-error";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { sanitizeNextPath } from "@/server/auth/redirect";
import { signInWithEmailPassword } from "@/server/auth/auth-service";
import { authActionFailure } from "@/server/contracts/action-result";
import { logAuthFailureEvent } from "@/server/observability/auth-events";
import { getRequestIdFromHeaders } from "@/server/security/request-id";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { mergeWishlistAfterCustomerAuth } from "@/server/services/wishlist-auth-merge.service";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
  nextPath: z.string().optional(),
});

function buildActionRequest(pathname: string, reqHeaders: Headers): Request {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: reqHeaders,
  });
}

export async function accountLoginAction(
  _previousState: AccountLoginActionState,
  formData: FormData
): Promise<AccountLoginActionState> {
  const reqHeaders = await headers();
  const requestId = getRequestIdFromHeaders(reqHeaders);

  try {
    const request = buildActionRequest("/account/login", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "customerLogin");
    if (limitedResponse) {
      logAuthFailureEvent({
        event: "auth.customer_login.failed",
        requestId,
        reasonCode: "RATE_LIMITED",
      });
      return authActionFailure(requestId, "RATE_LIMITED", AUTH_COPY_BY_CODE.RATE_LIMITED);
    }

    const parsed = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      nextPath: formData.get("nextPath"),
    });

    const sessionUser = await signInWithEmailPassword({
      email: parsed.email,
      password: parsed.password,
    });

    await mergeWishlistAfterCustomerAuth({
      requestHeaders: reqHeaders,
      requestId,
      authUserId: sessionUser.id,
      email: sessionUser.email ?? parsed.email,
    });

    redirect(sanitizeNextPath(parsed.nextPath, "/account"));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const mapped = mapAuthActionError(error);
    logAuthFailureEvent({
      event: "auth.customer_login.failed",
      requestId,
      reasonCode: mapped.code,
    });
    return authActionFailure(requestId, mapped.code, mapped.message);
  }
}
