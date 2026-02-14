import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { StorefrontProduct } from "@/features/storefront/home/types";

type ProductCardProps = {
  product: StorefrontProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  const cover = product.images[0]?.url;
  const totalInventory = product.variants.reduce(
    (acc, variant) => acc + variant.inventory,
    0
  );

  return (
    <article className="overflow-hidden vintage-panel">
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
        <Link href={`/products/${product.slug}`} className="inline-block btn-primary">
          View Details
        </Link>
      </div>
    </article>
  );
}
