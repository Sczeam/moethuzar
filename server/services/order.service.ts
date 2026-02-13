import { prisma } from "@/lib/prisma";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { AppError } from "@/server/errors";
import {
  CartStatus,
  InventoryChangeType,
  OrderStatus,
  Prisma,
  ProductStatus,
} from "@prisma/client";

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function createOrderCode(now: Date, sequence: number) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `MZT-${y}${m}${d}-${seq}`;
}

function orderDateRange(now: Date) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart, dayEnd };
}

type CreateOrderResult = {
  id: string;
  orderCode: string;
  status: OrderStatus;
  currency: string;
  subtotalAmount: string;
  deliveryFeeAmount: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    sku: string | null;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
  address: {
    country: string;
    stateRegion: string;
    townshipCity: string;
    addressLine1: string;
    addressLine2: string | null;
    postalCode: string | null;
  } | null;
};

export async function createOrderFromCart(
  guestToken: string,
  input: CheckoutInput
): Promise<CreateOrderResult> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { guestToken },
          include: {
            items: {
              orderBy: { createdAt: "asc" },
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        if (!cart || cart.status !== CartStatus.ACTIVE) {
          throw new AppError("Active cart not found.", 404, "CART_NOT_FOUND");
        }

        if (cart.items.length === 0) {
          throw new AppError("Cart is empty.", 400, "CART_EMPTY");
        }

        for (const item of cart.items) {
          if (!item.variant.isActive || item.variant.product.status !== ProductStatus.ACTIVE) {
            throw new AppError(
              `Variant ${item.variant.sku} is unavailable.`,
              409,
              "VARIANT_UNAVAILABLE"
            );
          }

          if (item.quantity > item.variant.inventory) {
            throw new AppError(
              `Variant ${item.variant.sku} is out of stock.`,
              409,
              "INSUFFICIENT_STOCK"
            );
          }
        }

        const subtotalAmount = cart.items.reduce((acc, item) => {
          const unitPrice = Number(toPriceString(item.price));
          return acc + unitPrice * item.quantity;
        }, 0);

        const deliveryFeeAmount = input.deliveryFeeAmount ?? 0;
        const totalAmount = subtotalAmount + deliveryFeeAmount;

        const now = new Date();
        const { dayStart, dayEnd } = orderDateRange(now);
        const sequence = (await tx.order.count({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        })) + 1;
        const orderCode = createOrderCode(now, sequence);

        const created = await tx.order.create({
          data: {
            orderCode,
            status: OrderStatus.PENDING,
            currency: cart.currency,
            subtotalAmount: subtotalAmount.toFixed(2),
            deliveryFeeAmount: deliveryFeeAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            customerName: input.customerName.trim(),
            customerPhone: input.customerPhone.trim(),
            customerEmail: normalizeOptionalText(input.customerEmail),
            customerNote: normalizeOptionalText(input.customerNote),
            address: {
              create: {
                country: "Myanmar",
                stateRegion: input.stateRegion.trim(),
                townshipCity: input.townshipCity.trim(),
                addressLine1: input.addressLine1.trim(),
                addressLine2: normalizeOptionalText(input.addressLine2),
                postalCode: normalizeOptionalText(input.postalCode),
              },
            },
            items: {
              create: cart.items.map((item) => {
                const unitPrice = Number(toPriceString(item.price));
                return {
                  productId: item.variant.product.id,
                  variantId: item.variant.id,
                  productName: item.variant.product.name,
                  productSlug: item.variant.product.slug,
                  variantName: item.variant.name,
                  sku: item.variant.sku,
                  unitPrice: unitPrice.toFixed(2),
                  quantity: item.quantity,
                  lineTotal: (unitPrice * item.quantity).toFixed(2),
                };
              }),
            },
            history: {
              create: {
                fromStatus: null,
                toStatus: OrderStatus.PENDING,
                note: "Order placed by customer.",
              },
            },
          },
          include: {
            address: true,
            items: true,
          },
        });

        for (const item of cart.items) {
          const updated = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              inventory: { gte: item.quantity },
            },
            data: {
              inventory: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count !== 1) {
            throw new AppError(
              `Variant ${item.variant.sku} no longer has enough stock.`,
              409,
              "INSUFFICIENT_STOCK"
            );
          }

          await tx.inventoryLog.create({
            data: {
              productId: item.variant.productId,
              variantId: item.variantId,
              orderId: created.id,
              changeType: InventoryChangeType.ORDER_CONFIRMED,
              quantity: -item.quantity,
              note: "Reserved when order was placed.",
            },
          });
        }

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            status: CartStatus.CONVERTED,
          },
        });

        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return created;
      });

      return {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        currency: order.currency,
        subtotalAmount: toPriceString(order.subtotalAmount),
        deliveryFeeAmount: toPriceString(order.deliveryFeeAmount),
        totalAmount: toPriceString(order.totalAmount),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerNote: order.customerNote,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          unitPrice: toPriceString(item.unitPrice),
          quantity: item.quantity,
          lineTotal: toPriceString(item.lineTotal),
        })),
        address: order.address
          ? {
              country: order.address.country,
              stateRegion: order.address.stateRegion,
              townshipCity: order.address.townshipCity,
              addressLine1: order.address.addressLine1,
              addressLine2: order.address.addressLine2,
              postalCode: order.address.postalCode,
            }
          : null,
      };
    } catch (error) {
      const isUniqueOrderCodeConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (isUniqueOrderCodeConflict && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new AppError("Failed to create order.", 500, "ORDER_CREATE_FAILED");
}
