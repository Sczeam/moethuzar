"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type AccountRegisterActionState } from "@/app/account/register/state";
import { isNextRedirectError } from "@/server/auth/action-errors";
import { mapAuthActionError } from "@/server/auth/auth-action-error";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { sanitizeNextPath } from "@/server/auth/redirect";
import { registerWithEmailPassword } from "@/server/auth/auth-recovery.service";
import { authActionFailure } from "@/server/contracts/action-result";
import { logAuthFailureEvent } from "@/server/observability/auth-events";
import { getRequestIdFromHeaders } from "@/server/security/request-id";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { mergeWishlistAfterCustomerAuth } from "@/server/services/wishlist-auth-merge.service";

const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(256),
    confirmPassword: z.string().min(8).max(256),
    nextPath: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.password !== input.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

function buildActionRequest(pathname: string, reqHeaders: Headers): Request {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: reqHeaders,
  });
}

export async function accountRegisterAction(
  _previousState: AccountRegisterActionState,
  formData: FormData
): Promise<AccountRegisterActionState> {
  const reqHeaders = await headers();
  const requestId = getRequestIdFromHeaders(reqHeaders);

  try {
    const request = buildActionRequest("/account/register", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "customerRegister");
    if (limitedResponse) {
      logAuthFailureEvent({
        event: "auth.customer_register.failed",
        requestId,
        reasonCode: "RATE_LIMITED",
      });
      return authActionFailure(requestId, "RATE_LIMITED", AUTH_COPY_BY_CODE.RATE_LIMITED);
    }

    const parsed = registerSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      nextPath: formData.get("nextPath"),
    });

    const registeredUser = await registerWithEmailPassword({
      email: parsed.email,
      password: parsed.password,
    });

    await mergeWishlistAfterCustomerAuth({
      requestHeaders: reqHeaders,
      requestId,
      authUserId: registeredUser.userId,
      email: parsed.email,
    });

    redirect(sanitizeNextPath(parsed.nextPath, "/account"));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const mapped = mapAuthActionError(error);
    logAuthFailureEvent({
      event: "auth.customer_register.failed",
      requestId,
      reasonCode: mapped.code,
    });

    return authActionFailure(requestId, mapped.code, mapped.message);
  }
}
