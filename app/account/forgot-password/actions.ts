"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { type AccountForgotPasswordActionState } from "@/app/account/forgot-password/state";
import { mapAuthActionError } from "@/server/auth/auth-action-error";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { sendPasswordReset } from "@/server/auth/auth-recovery.service";
import { authActionFailure, authActionSuccess } from "@/server/contracts/action-result";
import { logAuthFailureEvent } from "@/server/observability/auth-events";
import { getRequestIdFromHeaders } from "@/server/security/request-id";
import { rateLimitOrResponse } from "@/server/security/rate-limit";

const forgotSchema = z.object({
  email: z.string().trim().email(),
});

function buildActionRequest(pathname: string, reqHeaders: Headers): Request {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: reqHeaders,
  });
}

function resolveResetRedirectOrigin(reqHeaders: Headers): string {
  const origin = reqHeaders.get("origin");
  if (origin && origin.trim().length > 0) {
    return origin;
  }

  const host = reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function accountForgotPasswordAction(
  _previousState: AccountForgotPasswordActionState,
  formData: FormData
): Promise<AccountForgotPasswordActionState> {
  const reqHeaders = await headers();
  const requestId = getRequestIdFromHeaders(reqHeaders);

  try {
    const request = buildActionRequest("/account/forgot-password", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "customerForgotPassword");
    if (limitedResponse) {
      logAuthFailureEvent({
        event: "auth.customer_forgot_password.failed",
        requestId,
        reasonCode: "RATE_LIMITED",
      });
      return authActionFailure(requestId, "RATE_LIMITED", AUTH_COPY_BY_CODE.RATE_LIMITED);
    }

    const parsed = forgotSchema.parse({
      email: formData.get("email"),
    });

    const origin = resolveResetRedirectOrigin(reqHeaders);
    await sendPasswordReset({
      email: parsed.email,
      redirectTo: `${origin}/account/reset-password`,
    });

    return authActionSuccess(requestId, "RESET_LINK_SENT");
  } catch (error) {
    const mapped = mapAuthActionError(error);
    logAuthFailureEvent({
      event: "auth.customer_forgot_password.failed",
      requestId,
      reasonCode: mapped.code,
    });

    return authActionFailure(requestId, mapped.code, mapped.message);
  }
}

