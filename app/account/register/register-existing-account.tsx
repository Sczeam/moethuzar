"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountLoginAction } from "@/app/account/login/actions";
import { initialAccountLoginActionState } from "@/app/account/login/state";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import RegisterEmailSummary from "./register-email-summary";

type RegisterExistingAccountProps = {
  email: string;
  nextPath: string;
  onEdit: () => void;
};

export default function RegisterExistingAccount({
  email,
  nextPath,
  onEdit,
}: RegisterExistingAccountProps) {
  const [state, formAction] = useActionState(accountLoginAction, initialAccountLoginActionState);

  return (
    <form action={formAction} className="max-w-[32rem] space-y-6">
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

      <RegisterEmailSummary email={email} onEdit={onEdit} />

      <div className="space-y-3">
        <h2 className="text-[1.7rem] font-semibold leading-tight text-ink">
          Welcome back
        </h2>
        <p className="text-sm leading-6 text-charcoal">
          This email already has a Moethuzar account. Enter your password to continue, or
          reset it if you no longer remember it.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="existing-account-password" className="field-label">
          Password
        </label>
        <AuthInput
          id="existing-account-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter password"
        />
      </div>

      <AuthSubmitButton idleLabel="Sign in" pendingLabel="Signing in..." />
      <AuthFormStatus error={state.error} />

      <div className="space-y-2 text-sm text-charcoal">
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
