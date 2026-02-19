import { formatMoney } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import type { RefObject } from "react";
import { IconClose } from "@/components/layout/header/icons";

type CartDrawerItem = {
  id: string;
  quantity: number;
  lineTotal: string;
  unitPrice: string;
  variant: {
    id: string;
    name: string;
    inventory: number;
    product: {
      slug: string;
      name: string;
      images: { id: string; url: string; alt: string | null }[];
    };
  };
};

type CartDrawerData = {
  currency: string;
  subtotalAmount: string;
  itemCount: number;
  items: CartDrawerItem[];
};

type HeaderCartPanelProps = {
  isOpen: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  cart: CartDrawerData | null;
  loading: boolean;
  statusText: string;
  busyVariantId: string | null;
  onClose: () => void;
  onRemove: (variantId: string) => void;
};

function isSizeToken(value: string) {
  return /^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL)$/i.test(value.trim());
}

function normalizeColorToken(rawColor: string | null, productName: string) {
  if (!rawColor) {
    return null;
  }

  let value = rawColor.trim();
  const escapedName = productName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const productPrefixRegex = new RegExp(
    `^${escapedName}\\s*[-–—:/|]?\\s*`,
    "i",
  );
  value = value.replace(productPrefixRegex, "").trim();
  value = value.replace(/^[-–—:/|]\s*/, "").trim();

  return value.length > 0 ? value : null;
}

function getVariantMeta(variantName: string, productName: string) {
  const normalized = variantName.trim();
  const slashParts = normalized
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (slashParts.length >= 2) {
    const sizeCandidate = slashParts.find((part) => isSizeToken(part)) ?? null;
    const colorCandidate =
      slashParts.find((part) => !isSizeToken(part)) ?? null;
    return {
      color: normalizeColorToken(colorCandidate, productName),
      size: sizeCandidate,
    };
  }

  const dashParts = normalized
    .split(/\s*[-–—]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (dashParts.length >= 2) {
    const lastPart = dashParts[dashParts.length - 1];
    const maybeColor =
      isSizeToken(lastPart) && dashParts.length > 1
        ? dashParts[dashParts.length - 2]
        : lastPart;
    return {
      color: normalizeColorToken(maybeColor, productName),
      size: isSizeToken(lastPart) ? lastPart : null,
    };
  }

  const productPrefix = `${productName.trim()} -`;
  if (normalized.toLowerCase().startsWith(productPrefix.toLowerCase())) {
    const tail = normalized.slice(productPrefix.length).trim();
    if (tail.length > 0) {
      return {
        color: normalizeColorToken(tail, productName),
        size: null,
      };
    }
  }

  return {
    color: null,
    size: null,
  };
}

export function HeaderCartPanel({
  isOpen,
  panelRef,
  cart,
  loading,
  statusText,
  busyVariantId,
  onClose,
  onRemove,
}: HeaderCartPanelProps) {
  const itemCount = cart?.itemCount ?? 0;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cart drawer"
      className={`fixed right-0 top-0 z-[60] h-[100dvh] w-full max-w-none border-l border-sepia-border/60 bg-parchment text-ink sm:max-w-[min(40vw,460px)] ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-ink">
          Your selection ({itemCount})
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center text-ink transition hover:opacity-75"
          aria-label="Close cart drawer"
        >
          <IconClose />
        </button>
      </div>

      <div className="h-[calc(100dvh-76px)]">
        {loading ? (
          <p className="px-5 py-6 text-sm text-charcoal sm:px-6">
            Loading cart...
          </p>
        ) : null}

        {!loading && (!cart || cart.items.length === 0) ? (
          <div className="px-5 py-6 sm:px-6">
            <div className="border border-sepia-border bg-paper-light p-4 text-sm text-charcoal">
              Your cart is empty.
            </div>
          </div>
        ) : null}

        {!loading && cart && cart.items.length > 0 ? (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-3 sm:px-6">
              <div className="space-y-3">
                {cart.items.map((item) => {
                  const image = item.variant.product.images[0];
                  const busy = busyVariantId === item.variant.id;
                  const { color, size } = getVariantMeta(
                    item.variant.name,
                    item.variant.product.name,
                  );

                  return (
                    <article
                      key={item.id}
                      className="grid grid-cols-[120px_1fr] gap-4 border-b border-sepia-border/40 pb-4 sm:grid-cols-[132px_1fr]"
                    >
                      <div className="w-[120px] overflow-hidden bg-paper-light sm:w-[132px]">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt ?? item.variant.product.name}
                            width={132}
                            height={198}
                            sizes="(max-width: 640px) 120px, 132px"
                            className="h-auto w-full object-cover object-top"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.variant.product.slug}`}
                          onClick={onClose}
                          className="block truncate text-[1rem] font-semibold leading-snug"
                          title={item.variant.product.name}
                        >
                          {item.variant.product.name}
                        </Link>
                        {color ? (
                          <p className="mt-2 text-sm text-ink">
                            Color: {color}
                          </p>
                        ) : null}
                        {!color ? (
                          <p className="mt-2 text-sm text-ink">
                            Variant: {item.variant.name}
                          </p>
                        ) : null}
                        {size ? (
                          <p className="mt-1 text-sm text-ink">Size: {size}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-ink">
                          Qty: {item.quantity}
                        </p>
                        <p className="mt-2 text-[0.8rem] font-semibold leading-none text-ink">
                          {formatMoney(item.lineTotal, cart.currency)}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRemove(item.variant.id)}
                          disabled={busy}
                          className="mt-8 text-sm underline underline-offset-4 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-sepia-border/60 bg-paper-light px-5 py-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between text-base">
                <p className="font-semibold">Subtotal</p>
                <p className="font-semibold">
                  {formatMoney(cart.subtotalAmount, cart.currency)}
                </p>
              </div>
              <div className="grid gap-3">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="btn-secondary w-full text-sm uppercase"
                >
                  Go To Shopping Bag
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="btn-primary w-full text-sm uppercase"
                >
                  Proceed To Checkout
                </Link>
              </div>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-charcoal/80">
                By proceeding, you agree to our Terms and Privacy Policy.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {statusText ? (
        <p className="px-5 pt-3 text-xs text-seal-wax sm:px-6">{statusText}</p>
      ) : null}
    </div>
  );
}
