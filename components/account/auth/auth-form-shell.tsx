"use client";

import type { ReactNode } from "react";

type AuthFormShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  return (
    <section className="w-full vintage-panel p-6">
      <h1 className="text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-charcoal">{subtitle}</p>
      {children}
    </section>
  );
}

