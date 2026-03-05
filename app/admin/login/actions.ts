"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signInWithEmailPassword } from "@/server/auth/auth-service";
import { requireActiveAdminByAuthUserId } from "@/server/auth/admin";
import { sanitizeNextPath } from "@/server/auth/redirect";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(256),
  nextPath: z.string().optional(),
});

export type AdminLoginActionState = {
  ok: boolean;
  error: string;
};

export const initialAdminLoginActionState: AdminLoginActionState = {
  ok: false,
  error: "",
};

function buildActionRequest(pathname: string, reqHeaders: Headers): Request {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: reqHeaders,
  });
}

export async function adminLoginAction(
  _previousState: AdminLoginActionState,
  formData: FormData
): Promise<AdminLoginActionState> {
  try {
    const reqHeaders = await headers();
    const request = buildActionRequest("/admin/login", reqHeaders);
    const limitedResponse = rateLimitOrResponse(request, "adminLogin");
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
    const sessionUser = await signInWithEmailPassword({
      email: parsed.email,
      password: parsed.password,
    });
    await requireActiveAdminByAuthUserId(sessionUser.id);

    redirect(sanitizeNextPath(parsed.nextPath, "/admin/catalog"));
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "FORBIDDEN"
    ) {
      return { ok: false, error: "Admin account is not allowed." };
    }

    return { ok: false, error: "Unexpected server error." };
  }
}

