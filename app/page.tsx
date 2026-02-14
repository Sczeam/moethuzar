import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { listActiveProducts } from "@/server/services/product.service";

export default async function HomePage() {
  const products = await listActiveProducts();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-10 rounded-2xl bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">
          Moethuzar
        </p>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900 sm:text-4xl">
          Everyday streetwear, built for Myanmar.
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-700">
          Shop our latest essentials. Cash on delivery checkout is available nationwide.
        </p>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Latest Products</h2>
          <Link href="/cart" className="text-sm font-medium text-zinc-700 underline">
            View Cart
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-zinc-600">
            No products are available yet.
          </p>
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
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/5] bg-zinc-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      {product.category.name}
                    </p>
                    <h3 className="font-semibold text-zinc-900">{product.name}</h3>
                    <p className="text-sm text-zinc-600">
                      {formatMoney(product.price.toString(), product.currency)}
                    </p>
                    <p className="text-xs text-zinc-500">Stock: {totalInventory}</p>
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
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
