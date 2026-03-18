"use client";

import Link from "next/link";
import { useActionState } from "react";
import { accountRegisterAction } from "@/app/account/register/actions";
import { initialAccountRegisterActionState } from "@/app/account/register/state";
import { AuthInput } from "@/components/account/auth/auth-input";
import { AuthSubmitButton } from "@/components/account/auth/auth-submit-button";
import { AuthFormStatus } from "@/components/account/auth/auth-form-status";
import RegisterEmailSummary from "./register-email-summary";

export default function AccountRegisterForm({
  email,
  nextPath,
  onEditEmail,
}: {
  email: string;
  nextPath: string;
  onEditEmail: () => void;
}) {
  const [state, formAction] = useActionState(
    accountRegisterAction,
    initialAccountRegisterActionState
  );

  return (
    <form action={formAction} className="max-w-[32rem]">
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

      <RegisterEmailSummary email={email} onEdit={onEditEmail} />

      <div className="mb-6 space-y-3">
        <h2 className="text-[1.75rem] font-semibold leading-tight text-ink">
          Finish creating your account
        </h2>
        <p className="text-sm leading-6 text-charcoal">
          Create a password to complete your account and return to Moethuzar more
          easily next time.
        </p>
      </div>

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
      {state.code !== "EMAIL_ALREADY_REGISTERED" ? <AuthFormStatus error={state.error} /> : null}
      <div className="mt-4 space-y-2 text-sm text-charcoal">
        {state.code === "EMAIL_ALREADY_REGISTERED" ? (
          <div className="space-y-2 border border-sepia-border bg-paper-light px-4 py-4">
            <p className="font-medium text-ink">This email already has an account.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/account/login?next=${encodeURIComponent(nextPath)}`}
                className="underline hover:text-ink"
              >
                Sign in
              </Link>
              <Link href="/account/forgot-password" className="underline hover:text-ink">
                Forgot password
              </Link>
            </div>
          </div>
        ) : null}
        <p>
          Already have an account?{" "}
          <Link
            href={`/account/login?next=${encodeURIComponent(nextPath)}`}
            className="underline hover:text-ink"
          >
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

