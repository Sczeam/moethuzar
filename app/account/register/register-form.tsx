"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountRegisterAction } from "@/app/account/register/actions";
import { initialAccountRegisterActionState } from "@/app/account/register/state";
import { AuthFormShell } from "@/components/account/auth/auth-form-shell";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";

export default function AccountRegisterForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(
    accountRegisterAction,
    initialAccountRegisterActionState
  );

  return (
    <AuthFormShell
      title="Create Account"
      subtitle="Create an account to manage your orders faster."
    >
      <form action={formAction} className="mt-6">
        <input type="hidden" name="nextPath" value={nextPath} />
        <div className="space-y-3">
          <AuthInput
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
          />
          <AuthInput
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
          />
          <AuthInput
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm password"
          />
        </div>

        <AuthSubmitButton idleLabel="Create Account" pendingLabel="Creating account..." />
        <AuthFormStatus error={state.error} />
        <p className="mt-4 text-sm text-charcoal">
          Already have an account?{" "}
          <Link href={`/account/login?next=${encodeURIComponent(nextPath)}`} className="underline hover:text-ink">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}

