import Link from "next/link";

export default function LookbookPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-18rem)] w-full max-w-[860px] items-center px-4 py-16 sm:px-6">
      <div className="w-full border border-sepia-border/70 bg-paper-light px-6 py-10 sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-seal-wax">
          Coming Soon
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Lookbook</h1>
        <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-charcoal">
          We are curating seasonal editorials and styled looks. Check back soon for the
          first lookbook drop.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/#latest-products" className="btn-primary">
            Shop New In
          </Link>
          <Link href="/" className="btn-secondary">
            Back Home
          </Link>
        </div>
      </div>
    </section>
  );
}
