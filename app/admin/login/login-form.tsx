"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusText, setStatusText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatusText("");

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatusText(data.error ?? "Login failed.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setStatusText("Unexpected server error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-zinc-900">Admin Login</h1>
      <p className="mt-2 text-sm text-zinc-600">Sign in with your admin credentials.</p>

      <div className="mt-6 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>

      {statusText ? <p className="mt-4 text-sm text-red-700">{statusText}</p> : null}
    </form>
  );
}
