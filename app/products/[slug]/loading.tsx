export default function ProductLoadingPage() {
  return (
    <main className="vintage-shell max-w-5xl">
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-sepia-border/50" />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="aspect-[4/5] animate-pulse rounded-xl border border-sepia-border bg-sepia-border/30" />
        </section>
        <section className="space-y-5">
          <div className="h-10 w-3/4 animate-pulse rounded bg-sepia-border/50" />
          <div className="h-7 w-1/3 animate-pulse rounded bg-sepia-border/40" />
          <div className="h-5 w-full animate-pulse rounded bg-sepia-border/30" />
          <div className="h-5 w-5/6 animate-pulse rounded bg-sepia-border/30" />
          <div className="h-11 w-full animate-pulse rounded bg-sepia-border/40" />
          <div className="h-11 w-28 animate-pulse rounded bg-sepia-border/40" />
          <div className="h-10 w-36 animate-pulse rounded bg-sepia-border/50" />
        </section>
      </div>
    </main>
  );
}
