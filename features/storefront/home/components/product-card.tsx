import Link from "next/link";
import type { StorefrontProduct } from "@/features/storefront/home/types";

type ProductCardProps = {
  product: StorefrontProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  const cover = product.images[0]?.url;

  return (
    <article className="overflow-hidden border-r border-b border-sepia-border bg-paper-light">
      <div className="aspect-[4/5] bg-parchment">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="h-full w-full object-cover grayscale-[30%]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-charcoal">
            No image
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-sepia-border px-4 py-3">
        <h3 className="pr-3 text-sm font-bold uppercase tracking-[0.06em] text-ink">
          {product.name}
        </h3>
        <div className="shrink-0">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex border border-ink bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-paper-light transition hover:bg-teak-brown"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
