"use client";

import { useState } from "react";
import { RegisterBenefitsList } from "@/components/account/auth/register-benefits-list";
import { RegisterJourneyShell } from "@/components/account/auth/register-journey-shell";
import AccountRegisterForm from "./register-form";
import RegisterEmailStep from "./register-email-step";

type RegisterJourneyProps = {
  nextPath: string;
};

export default function RegisterJourney({ nextPath }: RegisterJourneyProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "details">("email");

  function handleContinue(nextEmail: string) {
    setEmail(nextEmail);
    setStep("details");
  }

  function handleEditEmail() {
    setStep("email");
  }

  if (step === "details") {
    return (
      <RegisterJourneyShell
        title="Finish creating your account"
        subtitle="Your email is set for this step. Create a password to complete your account."
        aside={<RegisterBenefitsList />}
      >
        <div className="mb-6 max-w-xl border border-sepia-border bg-parchment px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/65">
                Creating account for
              </p>
              <p className="mt-2 text-base text-ink">{email}</p>
            </div>
            <button
              type="button"
              onClick={handleEditEmail}
              className="text-sm underline decoration-sepia-border underline-offset-4 hover:text-ink"
            >
              Edit
            </button>
          </div>
        </div>

        <AccountRegisterForm email={email} nextPath={nextPath} />
      </RegisterJourneyShell>
    );
  }

  return (
    <RegisterJourneyShell
      title="Create your account"
      subtitle="Start with your email to unlock faster checkout, order tracking, and saved favourites."
      aside={<RegisterBenefitsList />}
    >
      <RegisterEmailStep nextPath={nextPath} defaultEmail={email} onContinue={handleContinue} />
    </RegisterJourneyShell>
  );
}
