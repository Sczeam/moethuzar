import { prisma } from "@/lib/prisma";
import type {
  AddCartItemInput,
  RemoveCartItemInput,
  SetCartItemQuantityInput,
} from "@/lib/validation/cart";
import { AppError } from "@/server/errors";
import { ProductStatus } from "@prisma/client";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" as const },
              },
            },
          },
        },
      },
    },
  },
};

type CartWithItems = Awaited<ReturnType<typeof getOrCreateCart>>;

async function getOrCreateCart(guestToken: string) {
  return prisma.cart.upsert({
    where: { guestToken },
    update: {},
    create: { guestToken },
    include: cartInclude,
  });
}

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

export function serializeCart(cart: CartWithItems) {
  const items = cart.items.map((item) => {
    const unitPrice = toPriceString(item.price);
    const lineTotal = (Number(unitPrice) * item.quantity).toFixed(2);

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        name: item.variant.name,
        color: item.variant.color,
        size: item.variant.size,
        inventory: item.variant.inventory,
        product: {
          id: item.variant.product.id,
          slug: item.variant.product.slug,
          name: item.variant.product.name,
          images: item.variant.product.images,
        },
      },
    };
  });

  const subtotalAmount = items
    .reduce((acc, item) => acc + Number(item.lineTotal), 0)
    .toFixed(2);

  return {
    id: cart.id,
    guestToken: cart.guestToken,
    currency: cart.currency,
    status: cart.status,
    subtotalAmount,
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
    items,
  };
}

async function loadActiveVariantOrThrow(variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      product: { status: ProductStatus.ACTIVE },
    },
    include: {
      product: true,
    },
  });

  if (!variant) {
    throw new AppError("Variant is unavailable.", 404, "VARIANT_NOT_FOUND");
  }

  return variant;
}

export async function getCartByToken(guestToken: string) {
  const cart = await getOrCreateCart(guestToken);
  return serializeCart(cart);
}

export async function addCartItem(guestToken: string, input: AddCartItemInput) {
  const variant = await loadActiveVariantOrThrow(input.variantId);

  const cart = await prisma.$transaction(async (tx) => {
    const activeCart = await tx.cart.upsert({
      where: { guestToken },
      update: {},
      create: { guestToken },
    });

    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: activeCart.id,
          variantId: input.variantId,
        },
      },
    });

    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;

    if (nextQuantity > variant.inventory) {
      throw new AppError(
        "Requested quantity exceeds available inventory.",
        409,
        "INSUFFICIENT_STOCK"
      );
    }

    const snapshotPrice = variant.price ?? variant.product.price;

    await tx.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: activeCart.id,
          variantId: input.variantId,
        },
      },
      update: {
        quantity: nextQuantity,
        price: snapshotPrice,
      },
      create: {
        cartId: activeCart.id,
        variantId: input.variantId,
        quantity: input.quantity,
        price: snapshotPrice,
      },
    });

    return tx.cart.findUniqueOrThrow({
      where: { id: activeCart.id },
      include: cartInclude,
    });
  });

  return serializeCart(cart);
}

export async function setCartItemQuantity(
  guestToken: string,
  input: SetCartItemQuantityInput
) {
  const cart = await prisma.cart.findUnique({
    where: { guestToken },
  });

  if (!cart) {
    throw new AppError("Cart not found.", 404, "CART_NOT_FOUND");
  }

  if (input.quantity === 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        variantId: input.variantId,
      },
    });

    const updated = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });

    return serializeCart(updated);
  }

  const variant = await loadActiveVariantOrThrow(input.variantId);

  if (input.quantity > variant.inventory) {
    throw new AppError(
      "Requested quantity exceeds available inventory.",
      409,
      "INSUFFICIENT_STOCK"
    );
  }

  const snapshotPrice = variant.price ?? variant.product.price;

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: input.variantId,
      },
    },
    update: {
      quantity: input.quantity,
      price: snapshotPrice,
    },
    create: {
      cartId: cart.id,
      variantId: input.variantId,
      quantity: input.quantity,
      price: snapshotPrice,
    },
  });

  const updated = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });

  return serializeCart(updated);
}

export async function removeCartItem(
  guestToken: string,
  input: RemoveCartItemInput
) {
  const cart = await prisma.cart.findUnique({
    where: { guestToken },
  });

  if (!cart) {
    throw new AppError("Cart not found.", 404, "CART_NOT_FOUND");
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      variantId: input.variantId,
    },
  });

  const updated = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });

  return serializeCart(updated);
}
