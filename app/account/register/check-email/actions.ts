"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { type AccountRegisterEmailCheckState } from "@/app/account/register/check-email/state";
import { checkCustomerEmailAvailability } from "@/server/auth/account-discovery.service";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { authActionFailure, authActionSuccess } from "@/server/contracts/action-result";
import { mapAuthActionError } from "@/server/auth/auth-action-error";
import { logAuthFailureEvent } from "@/server/observability/auth-events";
import { getRequestIdFromHeaders } from "@/server/security/request-id";

const emailCheckSchema = z.object({
  email: z.string().trim().email(),
});

export async function accountRegisterCheckEmailAction(
  _previousState: AccountRegisterEmailCheckState,
  formData: FormData
): Promise<AccountRegisterEmailCheckState> {
  const reqHeaders = await headers();
  const requestId = getRequestIdFromHeaders(reqHeaders);

  try {
    const parsed = emailCheckSchema.parse({
      email: formData.get("email"),
    });

    const result = await checkCustomerEmailAvailability(parsed.email);

    return authActionSuccess(requestId, "OK", {
      status: result.status,
      email: result.normalizedEmail,
    });
  } catch (error) {
    const mapped = mapAuthActionError(error);
    logAuthFailureEvent({
      event: "auth.customer_register.check_email_failed",
      requestId,
      reasonCode: mapped.code,
    });

    return authActionFailure(
      requestId,
      mapped.code === "UNAUTHORIZED" ? "UNEXPECTED_ERROR" : mapped.code,
      mapped.code === "UNAUTHORIZED" ? AUTH_COPY_BY_CODE.UNEXPECTED_ERROR : mapped.message
    );
  }
}
