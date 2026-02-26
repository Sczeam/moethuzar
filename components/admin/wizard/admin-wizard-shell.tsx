"use client";

import { useEffect, useMemo, useState } from "react";

type WizardStep<TStep extends string> = {
  id: TStep;
  label: string;
};

type AdminWizardShellProps<TStep extends string> = {
  steps: readonly WizardStep<TStep>[];
  currentStep: TStep;
  onStepChange: (step: TStep) => void;
  validateStep?: (step: TStep) => string | null;
  isDirty?: boolean;
  children: React.ReactNode;
};

export function AdminWizardShell<TStep extends string>({
  steps,
  currentStep,
  onStepChange,
  validateStep,
  isDirty = false,
  children,
}: AdminWizardShellProps<TStep>) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const currentIndex = useMemo(
    () => steps.findIndex((step) => step.id === currentStep),
    [steps, currentStep]
  );

  function guardedMove(nextStep: TStep) {
    const error = validateStep?.(currentStep) ?? null;
    if (error) {
      setFeedback(error);
      return;
    }
    setFeedback("");
    onStepChange(nextStep);
  }

  function handleStepClick(step: TStep) {
    if (step === currentStep) {
      return;
    }
    const targetIndex = steps.findIndex((item) => item.id === step);
    if (targetIndex > currentIndex) {
      guardedMove(step);
      return;
    }
    setFeedback("");
    onStepChange(step);
  }

  function handleBack() {
    if (currentIndex <= 0) {
      return;
    }
    setFeedback("");
    onStepChange(steps[currentIndex - 1].id);
  }

  function handleNext() {
    if (currentIndex < 0 || currentIndex >= steps.length - 1) {
      return;
    }
    guardedMove(steps[currentIndex + 1].id);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-sepia-border/70 bg-paper-light/30 p-3">
        <p className="mb-2 text-xs uppercase tracking-[0.08em] text-charcoal">Editor Steps</p>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              aria-current={step.id === currentStep ? "step" : undefined}
              className={`border px-3 py-1.5 text-xs uppercase tracking-[0.08em] ${
                currentStep === step.id
                  ? "border-ink bg-ink text-paper-light"
                  : "border-sepia-border text-charcoal"
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>
        {feedback ? <p className="mt-2 text-xs text-seal-wax">{feedback}</p> : null}
      </div>

      {children}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sepia-border/60 pt-3">
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={handleBack}
          disabled={currentIndex <= 0}
        >
          Back
        </button>
        <p className="text-xs uppercase tracking-[0.08em] text-charcoal">
          {steps[currentIndex]?.label ?? "Step"}
        </p>
        <button
          type="button"
          className="btn-secondary disabled:opacity-50"
          onClick={handleNext}
          disabled={currentIndex < 0 || currentIndex >= steps.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
