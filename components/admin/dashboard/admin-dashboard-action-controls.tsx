export function AdminDashboardActionControls() {
  return (
    <section className="rounded-[24px] border border-sepia-border/50 bg-paper-light p-4 shadow-[0_8px_22px_rgba(37,30,24,0.05)]" aria-label="Dashboard actions">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-sepia-border bg-parchment px-5 py-2 text-sm font-semibold text-charcoal/60 opacity-70"
        >
          Export CSV
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-sepia-border bg-parchment px-5 py-2 text-sm font-semibold text-charcoal/60 opacity-70"
        >
          Download Report
        </button>
      </div>
    </section>
  );
}
