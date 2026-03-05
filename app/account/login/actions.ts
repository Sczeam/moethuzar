"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInWithEmailPassword } from "@/server/auth/auth-service";
import { sanitizeNextPath } from "@/server/auth/redirect";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
  nextPath: z.string().optional(),
});

export type AccountLoginActionState = {
  ok: boolean;
  error: string;
};

export const initialAccountLoginActionState: AccountLoginActionState = {
  ok: false,
  error: "",
};

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
  try {
    const reqHeaders = await headers();
    const request = buildActionRequest("/account/login", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "customerLogin");
    if (limitedResponse) {
      const payload = await limitedResponse.json();
      return {
        ok: false,
        error: typeof payload?.error === "string" ? payload.error : "Too many requests.",
      };
    }

    const parsed = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      nextPath: formData.get("nextPath"),
    });

    await signInWithEmailPassword({
      email: parsed.email,
      password: parsed.password,
    });

    redirect(sanitizeNextPath(parsed.nextPath, "/account"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: "Please enter a valid email and password." };
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "UNAUTHORIZED"
    ) {
      return { ok: false, error: "Invalid email or password." };
    }

    return { ok: false, error: "Unexpected server error." };
  }
}

