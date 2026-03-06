"use client";

import { adminStateTextClass } from "@/lib/admin/state-clarity";

type AuthFormStatusProps = {
  error: string;
};

export function AuthFormStatus({ error }: AuthFormStatusProps) {
  if (!error) {
    return null;
  }

  return <p className={`mt-4 text-sm ${adminStateTextClass("danger")}`}>{error}</p>;
}

