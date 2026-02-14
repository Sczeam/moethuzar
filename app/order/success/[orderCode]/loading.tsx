export default function OrderSuccessLoadingPage() {
  return (
    <main className="vintage-shell max-w-4xl">
      <section className="vintage-panel p-6">
        <div className="h-4 w-28 animate-pulse rounded bg-sepia-border/50" />
        <div className="mt-3 h-10 w-2/3 animate-pulse rounded bg-sepia-border/50" />
        <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-sepia-border/40" />
      </section>

      <section className="mt-8 vintage-panel p-5">
        <div className="h-6 w-36 animate-pulse rounded bg-sepia-border/50" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-5 animate-pulse rounded bg-sepia-border/35" />
          ))}
        </div>
      </section>
    </main>
  );
}
