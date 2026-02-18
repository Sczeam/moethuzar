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
  onIncrement: (variantId: string, currentQty: number, maxQty: number) => void;
  onDecrement: (variantId: string, currentQty: number) => void;
  onRemove: (variantId: string) => void;
};

export function HeaderCartPanel({
  isOpen,
  panelRef,
  cart,
  loading,
  statusText,
  busyVariantId,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
}: HeaderCartPanelProps) {
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cart drawer"
      className={`fixed right-0 top-0 z-[60] h-[100dvh] w-full max-w-none border-l border-sepia-border/60 bg-parchment p-5 text-ink sm:max-w-[min(40vw,420px)] sm:p-6 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-ink">Cart</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center border border-sepia-border text-ink transition hover:opacity-75"
          aria-label="Close cart drawer"
        >
          <IconClose />
        </button>
      </div>

      {loading ? <p className="mt-6 text-sm text-charcoal">Loading cart...</p> : null}

      {!loading && (!cart || cart.items.length === 0) ? (
        <div className="mt-6 rounded border border-sepia-border bg-paper-light p-4 text-sm text-charcoal">
          Your cart is empty.
        </div>
      ) : null}

      {!loading && cart && cart.items.length > 0 ? (
        <>
          <div className="mt-5 max-h-[56vh] space-y-3 overflow-auto pr-1">
            {cart.items.map((item) => {
              const image = item.variant.product.images[0];
              const busy = busyVariantId === item.variant.id;
              return (
                <article key={item.id} className="grid grid-cols-[64px_1fr_auto] gap-3 border border-sepia-border bg-paper-light p-2.5">
                  <div className="h-16 w-16 overflow-hidden bg-parchment">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.alt ?? item.variant.product.name}
                        width={64}
                        height={64}
                        sizes="64px"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <Link href={`/products/${item.variant.product.slug}`} onClick={onClose} className="text-sm font-semibold leading-tight">
                      {item.variant.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-charcoal">{item.variant.name}</p>
                    <p className="mt-1 text-xs text-charcoal">
                      {formatMoney(item.unitPrice, cart.currency)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="inline-flex items-center border border-sepia-border">
                      <button
                        type="button"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => onDecrement(item.variant.id, item.quantity)}
                        className="h-7 w-7 text-sm disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={busy || item.quantity >= Math.max(1, item.variant.inventory)}
                        onClick={() => onIncrement(item.variant.id, item.quantity, item.variant.inventory)}
                        className="h-7 w-7 text-sm disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs font-semibold">{formatMoney(item.lineTotal, cart.currency)}</p>
                    <button
                      type="button"
                      onClick={() => onRemove(item.variant.id)}
                      disabled={busy}
                      className="text-[11px] text-seal-wax underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 border-t border-sepia-border pt-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <p>Subtotal</p>
              <p className="font-semibold">{formatMoney(cart.subtotalAmount, cart.currency)}</p>
            </div>
            <div className="grid gap-2">
              <Link href="/checkout" onClick={onClose} className="btn-primary w-full">
                Checkout
              </Link>
              <Link href="/cart" onClick={onClose} className="btn-secondary w-full">
                View Cart
              </Link>
              <button type="button" onClick={onClose} className="btn-secondary w-full">
                Continue Shopping
              </button>
            </div>
          </div>
        </>
      ) : null}

      {statusText ? <p className="mt-4 text-xs text-seal-wax">{statusText}</p> : null}
    </div>
  );
}
