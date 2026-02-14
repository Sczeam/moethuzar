import Link from "next/link";
import ProductListEmptyState from "@/components/storefront/product-list-empty-state";
import ProductListErrorState from "@/components/storefront/product-list-error-state";
import { formatMoney } from "@/lib/format";
import { listActiveProducts } from "@/server/services/product.service";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof listActiveProducts>> = [];
  let hasLoadError = false;

  try {
    products = await listActiveProducts();
  } catch {
    hasLoadError = true;
  }

  return (
    <main className="vintage-shell">
      <section className="mb-10 vintage-panel p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teak-brown">
          Moethuzar
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">
          Everyday streetwear, built for Myanmar.
        </h1>
        <p className="mt-4 max-w-2xl text-charcoal">
          Shop our latest essentials. Cash on delivery checkout is available nationwide.
        </p>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-ink">Latest Products</h2>
          <div className="flex gap-2">
            <Link href="/order/track" className="btn-secondary">
              Track Order
            </Link>
            <Link href="/cart" className="btn-secondary">
              View Cart
            </Link>
          </div>
        </div>

        {hasLoadError ? (
          <ProductListErrorState />
        ) : products.length === 0 ? (
          <ProductListEmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const cover = product.images[0]?.url;
              const totalInventory = product.variants.reduce(
                (acc, variant) => acc + variant.inventory,
                0
              );

              return (
                <article
                  key={product.id}
                  className="overflow-hidden vintage-panel shadow-[0_6px_20px_rgba(37,30,24,0.08)]"
                >
                  <div className="aspect-[4/5] bg-parchment">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-charcoal">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wider text-teak-brown">
                      {product.category.name}
                    </p>
                    <h3 className="text-xl font-semibold text-ink">{product.name}</h3>
                    <p className="text-sm text-charcoal">
                      {formatMoney(product.price.toString(), product.currency)}
                    </p>
                    {totalInventory > 0 ? (
                      <p className="text-xs text-charcoal">Stock: {totalInventory}</p>
                    ) : (
                      <span className="inline-flex rounded-full border border-seal-wax/50 bg-seal-wax/10 px-2 py-1 text-xs font-semibold text-seal-wax">
                        Sold out
                      </span>
                    )}
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-block btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
