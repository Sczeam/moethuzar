export default function AdminOrderDetailLoadingPage() {
  return (
    <main className="vintage-shell max-w-5xl">
      <div className="h-10 w-36 animate-pulse rounded bg-sepia-border/45" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <section key={index} className="vintage-panel p-5">
            <div className="h-6 w-48 animate-pulse rounded bg-sepia-border/40" />
            <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-sepia-border/30" />
          </section>
        ))}
      </div>
    </main>
  );
}
