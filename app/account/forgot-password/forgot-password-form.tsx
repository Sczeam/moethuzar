"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountForgotPasswordAction } from "@/app/account/forgot-password/actions";
import { initialAccountForgotPasswordActionState } from "@/app/account/forgot-password/state";
import { AUTH_COPY_BY_CODE } from "@/server/auth/auth-copy";
import { AuthFormShell } from "@/components/account/auth/auth-form-shell";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    accountForgotPasswordAction,
    initialAccountForgotPasswordActionState
  );

  return (
    <AuthFormShell
      title="Forgot Password"
      subtitle="Enter your email and we will send password reset instructions."
    >
      <form action={formAction} className="mt-6">
        <div className="space-y-3">
          <AuthInput
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
          />
        </div>

        <AuthSubmitButton idleLabel="Send Reset Link" pendingLabel="Sending..." />

        {state.code === "RESET_LINK_SENT" ? (
          <p className="mt-4 text-sm text-charcoal">{AUTH_COPY_BY_CODE.RESET_LINK_SENT}</p>
        ) : (
          <AuthFormStatus error={state.error} />
        )}

        <p className="mt-4 text-sm text-charcoal">
          Remembered your password?{" "}
          <Link href="/account/login" className="underline hover:text-ink">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}

