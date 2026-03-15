"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountRegisterAction } from "@/app/account/register/actions";
import { initialAccountRegisterActionState } from "@/app/account/register/state";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";

export default function AccountRegisterForm({
  email,
  nextPath,
}: {
  email: string;
  nextPath: string;
}) {
  const [state, formAction] = useActionState(
    accountRegisterAction,
    initialAccountRegisterActionState
  );

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name="nextPath" value={nextPath} />
      <input
        name="email"
        type="email"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <div className="space-y-3">
        <label htmlFor="register-password" className="field-label">
          Password
        </label>
        <AuthInput
          id="register-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Create password"
        />
        <label htmlFor="register-confirm-password" className="field-label">
          Confirm password
        </label>
        <AuthInput
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm password"
        />
      </div>

      <AuthSubmitButton idleLabel="Create account" pendingLabel="Creating account..." />
      <AuthFormStatus error={state.error} />
      <div className="mt-4 space-y-2 text-sm text-charcoal">
        <p>
          Already have an account?{" "}
          <Link href={`/account/login?next=${encodeURIComponent(nextPath)}`} className="underline hover:text-ink">
            Sign in
          </Link>
        </p>
        <p>
          Forgot your password?{" "}
          <Link href="/account/forgot-password" className="underline hover:text-ink">
            Reset it
          </Link>
        </p>
      </div>
    </form>
  );
}

