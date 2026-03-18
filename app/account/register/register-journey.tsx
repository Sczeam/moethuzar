"use client";

import { useCallback, useState } from "react";
import { RegisterBenefitsList } from "@/components/account/auth/register-benefits-list";
import { RegisterJourneyShell } from "@/components/account/auth/register-journey-shell";
import AccountRegisterForm from "./register-form";
import RegisterEmailStep from "./register-email-step";
import RegisterExistingAccount from "./register-existing-account";

type RegisterJourneyProps = {
  nextPath: string;
};

export default function RegisterJourney({ nextPath }: RegisterJourneyProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "details" | "existing">("email");

  const handleAvailableEmail = useCallback((nextEmail: string) => {
    setEmail(nextEmail);
    setStep("details");
  }, []);

  const handleExistingEmail = useCallback((nextEmail: string) => {
    setEmail(nextEmail);
    setStep("existing");
  }, []);

  const handleEditEmail = useCallback(() => {
    setStep("email");
  }, []);

  if (step === "details") {
    return (
      <RegisterJourneyShell
        title="Create your personal account"
        subtitle="Complete the final step to create your Moethuzar account."
        aside={<RegisterBenefitsList />}
      >
        <AccountRegisterForm email={email} nextPath={nextPath} onEditEmail={handleEditEmail} />
      </RegisterJourneyShell>
    );
  }

  if (step === "existing") {
    return (
      <RegisterJourneyShell
        title="This email is already registered"
        subtitle="Use the existing account for this email, or reset the password if needed."
        aside={<RegisterBenefitsList />}
      >
        <RegisterExistingAccount email={email} nextPath={nextPath} onEdit={handleEditEmail} />
      </RegisterJourneyShell>
    );
  }

  return (
    <RegisterJourneyShell title="Enter your email" aside={<RegisterBenefitsList />}>
      <RegisterEmailStep
        nextPath={nextPath}
        defaultEmail={email}
        onEmailAvailable={handleAvailableEmail}
        onEmailExists={handleExistingEmail}
      />
    </RegisterJourneyShell>
  );
}
