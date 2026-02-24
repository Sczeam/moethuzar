export function AdminDashboardActionControls() {
  return (
    <section className="vintage-panel p-4" aria-label="Dashboard actions">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-10 items-center justify-center rounded-none border border-sepia-border bg-parchment px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal/60 opacity-70"
        >
          Export CSV
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex min-h-10 items-center justify-center rounded-none border border-sepia-border bg-parchment px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal/60 opacity-70"
        >
          Download Report
        </button>
      </div>
      <p className="mt-2 text-xs text-charcoal">
        Reporting exports will be enabled after final dashboard rollout.
      </p>
    </section>
  );
}
