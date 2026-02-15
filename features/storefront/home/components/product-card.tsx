import Image from "next/image";
import Link from "next/link";
import type { StorefrontProduct } from "@/features/storefront/home/types";

type ProductCardProps = {
  product: StorefrontProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  const cover = product.images[0]?.url;
  const hoverImage = product.images[1]?.url;

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-sepia-border bg-paper-light">
      <div className="relative aspect-[4/5] bg-parchment">
        {cover ? (
          <>
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`absolute inset-0 h-full w-full object-cover object-center grayscale-[30%] transition-opacity duration-300 motion-reduce:transition-none ${
                hoverImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {hoverImage ? (
              <Image
                src={hoverImage}
                alt={`${product.name} alternate view`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="absolute inset-0 h-full w-full object-cover object-center grayscale-[30%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
              />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-charcoal">
            No image
          </div>
        )}
      </div>
      <div className="mt-auto flex min-h-[64px] items-center justify-between border-t border-sepia-border px-4 py-3">
        <h3 className="pr-3 text-sm font-bold uppercase tracking-[0.06em] text-ink">
          {product.name}
        </h3>
        <div className="shrink-0">
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex min-h-8 items-center border border-ink bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-paper-light transition hover:bg-teak-brown"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
