"use client";

import { adminDisabledControlClass } from "@/lib/admin/state-clarity";
import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ idleLabel, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`btn-primary mt-5 w-full ${adminDisabledControlClass()}`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

