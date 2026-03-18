"use client";

import { accountLoginAction } from "@/app/account/login/actions";
import { initialAccountLoginActionState } from "@/app/account/login/state";
import { AuthFormShell } from "@/components/account/auth/auth-form-shell";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { useActionState } from "react";
import Link from "next/link";

export default function AccountLoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(accountLoginAction, initialAccountLoginActionState);

  return (
    <AuthFormShell
      title="Account Login"
      subtitle="Sign in to view your orders and account details."
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
            autoComplete="current-password"
            placeholder="Password"
          />
        </div>

        <AuthSubmitButton idleLabel="Sign In" pendingLabel="Signing in..." />
        <AuthFormStatus error={state.error} />
        <p className="mt-4 text-sm text-charcoal">
          <Link href="/account/forgot-password" className="underline hover:text-ink">
            Forgot password?
          </Link>
        </p>
        <p className="mt-2 text-sm text-charcoal">
          No account yet?{" "}
          <Link
            href={`/account/register?next=${encodeURIComponent(nextPath)}`}
            className="underline hover:text-ink"
          >
            Create your account
          </Link>
        </p>
      </form>
    </AuthFormShell>
  );
}

