"use client";

import type { ReactNode } from "react";

type RegisterJourneyShellProps = {
  title: string;
  subtitle?: string;
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
    <section className="w-full">
      <div className="mx-auto max-w-[32rem] px-1 py-8 sm:py-12">
        <div className="space-y-8 sm:space-y-10">
          <div className="space-y-3">
            <h1 className="text-[2.1rem] font-semibold leading-none text-ink sm:text-[2.35rem]">
              {title}
            </h1>
            {subtitle ? <p className="text-sm leading-6 text-charcoal">{subtitle}</p> : null}
          </div>

          <div>{children}</div>

          {aside ? <div className="border-t border-sepia-border/85 pt-8 sm:pt-10">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
