"use client";

import type { ReactNode } from "react";

type RegisterJourneyShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function RegisterJourneyShell({
  title,
  subtitle,
  children,
  aside,
}: RegisterJourneyShellProps) {
  return (
    <section className="w-full overflow-hidden border border-sepia-border bg-paper-light">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/65">
            Personal account
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>

        {aside ? (
          <aside className="border-t border-sepia-border/80 bg-parchment/60 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            {aside}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
