import type { ReactNode } from "react";

type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
};

export function LegalPage({ title, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <main className="vintage-shell max-w-4xl">
      <article className="vintage-panel p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-charcoal">Last updated: {lastUpdated}</p>
        {intro ? <div className="mt-4 text-sm leading-7 text-charcoal">{intro}</div> : null}

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-charcoal">{section.content}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
