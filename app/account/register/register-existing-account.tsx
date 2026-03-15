"use client";

import Link from "next/link";

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
  return (
    <div className="max-w-[32rem] space-y-6">
      <div className="border border-sepia-border bg-paper-light px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/65">
              Existing account found
            </p>
            <p className="mt-2 text-base text-ink">{email}</p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-sm underline decoration-sepia-border underline-offset-4 hover:text-ink"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-[1.7rem] font-semibold leading-tight text-ink">
          You already have an account
        </h2>
        <p className="text-sm leading-6 text-charcoal">
          Sign in with this email to access your account, or reset your password if you no
          longer remember it.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/account/login?next=${encodeURIComponent(nextPath)}`}
          className="btn-primary min-h-14 flex-1"
        >
          Sign in
        </Link>
        <Link href="/account/forgot-password" className="btn-secondary min-h-14 flex-1">
          Forgot password
        </Link>
      </div>
    </div>
  );
}
