export default function Loading() {
  return (
    <main>
      <section className="relative min-h-[clamp(560px,84vh,820px)] overflow-hidden border-b border-sepia-border/60 bg-ink">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_22%_35%,rgba(122,46,42,0.35),rgba(37,30,24,0.85))]" />

        <div className="relative z-10 hidden h-11 items-center border-b border-paper-light/20 bg-seal-wax/90 px-6 lg:flex">
          <div className="mx-auto flex w-full max-w-[1280px] items-center justify-center gap-10">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-3 w-16 animate-pulse bg-paper-light/45" />
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[clamp(560px,84vh,820px)] w-full max-w-[1280px] items-center px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <div className="h-16 w-[min(90vw,540px)] animate-pulse bg-seal-wax/65 sm:h-20" />
            <div className="mt-4 h-16 w-[min(90vw,500px)] animate-pulse bg-seal-wax/65 sm:h-20" />
            <div className="mt-8 h-12 w-44 animate-pulse bg-seal-wax/75" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1760px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 h-9 w-56 animate-pulse bg-sepia-border/55" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-0 lg:grid-cols-3 md:border md:border-sepia-border">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="overflow-hidden border border-sepia-border bg-paper-light p-4 md:border-0 md:border-r md:border-b md:border-sepia-border">
              <div className="aspect-[4/5] animate-pulse bg-sepia-border/40" />
              <div className="mt-4 space-y-3">
                <div className="h-5 w-2/3 animate-pulse bg-sepia-border/55" />
                <div className="h-4 w-1/3 animate-pulse bg-sepia-border/45" />
                <div className="h-9 w-28 animate-pulse bg-sepia-border/50" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
