"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type AccountResetPasswordActionState } from "@/app/account/reset-password/state";
import { isNextRedirectError } from "@/server/auth/action-errors";
import { mapAuthActionError } from "@/server/auth/auth-action-error";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { resetPasswordWithSession } from "@/server/auth/auth-recovery.service";
import { authActionFailure } from "@/server/contracts/action-result";
import { logAuthFailureEvent } from "@/server/observability/auth-events";
import { sanitizeNextPath } from "@/server/auth/redirect";
import { getRequestIdFromHeaders } from "@/server/security/request-id";
import { rateLimitOrResponse } from "@/server/security/rate-limit";

const resetSchema = z
  .object({
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

export async function accountResetPasswordAction(
  _previousState: AccountResetPasswordActionState,
  formData: FormData
): Promise<AccountResetPasswordActionState> {
  const reqHeaders = await headers();
  const requestId = getRequestIdFromHeaders(reqHeaders);

  try {
    const request = buildActionRequest("/account/reset-password", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "customerResetPassword");
    if (limitedResponse) {
      logAuthFailureEvent({
        event: "auth.customer_reset_password.failed",
        requestId,
        reasonCode: "RATE_LIMITED",
      });
      return authActionFailure(requestId, "RATE_LIMITED", AUTH_COPY_BY_CODE.RATE_LIMITED);
    }

    const parsed = resetSchema.parse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      nextPath: formData.get("nextPath"),
    });

    await resetPasswordWithSession({
      password: parsed.password,
    });

    redirect(sanitizeNextPath(parsed.nextPath, "/account"));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const mapped = mapAuthActionError(error);
    logAuthFailureEvent({
      event: "auth.customer_reset_password.failed",
      requestId,
      reasonCode: mapped.code,
    });

    return authActionFailure(requestId, mapped.code, mapped.message);
  }
}

