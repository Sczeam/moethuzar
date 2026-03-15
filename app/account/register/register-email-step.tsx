"use client";

import Link from "next/link";
import { useState } from "react";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email.");
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!emailIsValid) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    onContinue(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl">
      <label htmlFor="register-email" className="field-label">
        Email address
      </label>
      <input
        id="register-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className={`field-input ${error ? "field-input-invalid" : ""}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? "register-email-error" : undefined}
      />
      {error ? (
        <p id="register-email-error" className="field-error">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary min-w-40">
          Continue
        </button>
        <p className="text-sm text-charcoal">
          Already have an account?{" "}
          <Link
            href={`/account/login?next=${encodeURIComponent(nextPath)}`}
            className="underline hover:text-ink"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
