export default function AdminOrdersLoadingPage() {
  return (
    <main className="space-y-4 md:space-y-6">
      <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5">
        <div className="h-8 w-56 animate-pulse rounded bg-sepia-border/35" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded bg-sepia-border/30" />
        <div className="mt-4 h-11 w-64 animate-pulse rounded bg-sepia-border/40" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="vintage-panel rounded-[22px] border-sepia-border/50 p-4 md:p-5">
            <div className="h-4 w-32 animate-pulse rounded bg-sepia-border/35" />
            <div className="mt-3 h-8 w-40 animate-pulse rounded bg-sepia-border/40" />
          </div>
        ))}
      </section>

      <section className="vintage-panel rounded-[24px] border-sepia-border/50 p-4 md:p-5">
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-sepia-border/30" />
          ))}
        </div>
      </section>
    </main>
  );
}
