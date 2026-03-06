"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountResetPasswordAction } from "@/app/account/reset-password/actions";
import { initialAccountResetPasswordActionState } from "@/app/account/reset-password/state";
import { AuthFormShell } from "@/components/account/auth/auth-form-shell";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";

export default function ResetPasswordForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(
    accountResetPasswordAction,
    initialAccountResetPasswordActionState
  );

  return (
    <AuthFormShell
      title="Reset Password"
      subtitle="Set a new password to continue with your account."
    >
      <form action={formAction} className="mt-6">
        <input type="hidden" name="nextPath" value={nextPath} />
        <div className="space-y-3">
          <AuthInput
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password (min 8 characters)"
          />
          <AuthInput
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
          />
        </div>

        <AuthSubmitButton idleLabel="Update Password" pendingLabel="Updating..." />
        <AuthFormStatus error={state.error} />
        <p className="mt-4 text-sm text-charcoal">
          Back to{" "}
          <Link href="/account/login" className="underline hover:text-ink">
            account login
          </Link>
          .
        </p>
      </form>
    </AuthFormShell>
  );
}

