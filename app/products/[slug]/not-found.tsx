import Link from "next/link";

export default function ProductNotFoundPage() {
  return (
    <main className="vintage-shell max-w-3xl">
      <section className="vintage-panel p-8">
        <h1 className="text-3xl font-semibold text-ink">Product not found</h1>
        <p className="mt-3 text-charcoal">
          This product may have been removed or is no longer available.
        </p>
        <Link href="/" className="mt-6 inline-flex btn-primary">
          Back to Home
        </Link>
      </section>
    </main>
  );
}
