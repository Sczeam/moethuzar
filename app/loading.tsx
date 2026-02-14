export default function Loading() {
  return (
    <main className="vintage-shell">
      <section className="mb-10 vintage-panel p-8 sm:p-10">
        <div className="h-4 w-28 animate-pulse rounded bg-sepia-border/50" />
        <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-sepia-border/50" />
        <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-sepia-border/40" />
      </section>

      <section>
        <div className="mb-6 h-9 w-48 animate-pulse rounded bg-sepia-border/50" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="overflow-hidden vintage-panel p-4">
              <div className="aspect-[4/5] animate-pulse rounded bg-sepia-border/40" />
              <div className="mt-4 space-y-3">
                <div className="h-3 w-20 animate-pulse rounded bg-sepia-border/50" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-sepia-border/50" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-sepia-border/40" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-sepia-border/40" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
