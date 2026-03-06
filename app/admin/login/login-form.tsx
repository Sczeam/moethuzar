"use client";

import { adminDisabledControlClass, adminStateTextClass } from "@/lib/admin/state-clarity";
import { adminLoginAction } from "@/app/admin/login/actions";
import { initialAdminLoginActionState } from "@/app/admin/login/state";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(adminLoginAction, initialAdminLoginActionState);

  return (
    <form action={formAction} className="w-full vintage-panel p-6">
      <h1 className="text-3xl font-semibold text-ink">Admin Login</h1>
      <p className="mt-2 text-sm text-charcoal">Sign in with your admin credentials.</p>
      <input type="hidden" name="nextPath" value={nextPath} />

      <div className="mt-6 space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="w-full rounded-md border border-sepia-border bg-parchment px-3 py-2"
        />
      </div>

      <LoginSubmitButton />

      {state.error ? (
        <p className={`mt-4 text-sm ${adminStateTextClass("danger")}`}>{state.error}</p>
      ) : null}
    </form>
  );
}

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`btn-primary mt-5 w-full ${adminDisabledControlClass()}`}
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}
