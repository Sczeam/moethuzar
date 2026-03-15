"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type RegisterEmailStepProps = {
  defaultEmail?: string;
  nextPath: string;
  onContinue: (email: string) => void;
};

export default function RegisterEmailStep({
  defaultEmail = "",
  nextPath,
  onContinue,
}: RegisterEmailStepProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email.");
      emailInputRef.current?.focus();
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailIsValid) {
      setError("Enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    setError("");
    onContinue(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <input
        id="register-email"
        ref={emailInputRef}
        name="email"
        type="email"
        autoComplete="email"
        aria-label="E-mail address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="E-mail address*"
        className={`w-full rounded-none border border-sepia-border bg-parchment px-4 py-4 text-base text-ink outline-none transition focus:border-antique-brass focus:ring-2 focus:ring-antique-brass/20 ${error ? "border-seal-wax/80 focus:border-seal-wax focus:ring-seal-wax/20" : ""}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? "register-email-error" : undefined}
      />
      {error ? (
        <p id="register-email-error" role="alert" className="field-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex min-h-14 w-full items-center justify-center rounded-none border border-antique-brass bg-antique-brass px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink transition hover:bg-aged-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Next
      </button>

      <div className="text-sm text-charcoal">
        Already have an account?{" "}
        <Link
          href={`/account/login?next=${encodeURIComponent(nextPath)}`}
          className="underline hover:text-ink"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
