import { prisma } from "@/lib/prisma";
import { resolvePaymentPolicyByZone } from "@/lib/payment-policy";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { AppError } from "@/server/errors";
import { assertActivePaymentTransferMethodByCode } from "@/server/services/payment-transfer-method.service";
import { resolveShippingQuote } from "@/server/services/shipping-rule.service";
import {
  CartStatus,
  InventoryChangeType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
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

function extractTransferMethodCode(paymentReference: string | null): string | null {
  if (!paymentReference) {
    return null;
  }

  const [methodCode] = paymentReference.split(":", 1);
  const normalized = methodCode?.trim();
  return normalized ? normalized : null;
}

function createOrderCode(now: Date) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `MZT-${y}${m}${d}-${hh}${mm}${ss}${rand}`;
}

type CreateOrderResult = {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  paymentReference: string | null;
  paymentSubmittedAt: Date | null;
  paymentVerifiedAt: Date | null;
  currency: string;
  subtotalAmount: string;
  deliveryFeeAmount: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerNote: string | null;
  shippingZoneKey: string | null;
  shippingZoneLabel: string | null;
  shippingEtaLabel: string | null;
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
  input: CheckoutInput,
  options?: { idempotencyKey?: string }
): Promise<CreateOrderResult> {
  if (options?.idempotencyKey) {
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: options.idempotencyKey },
      include: {
        address: true,
        items: true,
      },
    });

    if (existingOrder) {
      return {
        id: existingOrder.id,
        orderCode: existingOrder.orderCode,
        status: existingOrder.status,
        paymentMethod: existingOrder.paymentMethod,
        paymentStatus: existingOrder.paymentStatus,
        paymentProofUrl: existingOrder.paymentProofUrl,
        paymentReference: existingOrder.paymentReference,
        paymentSubmittedAt: existingOrder.paymentSubmittedAt,
        paymentVerifiedAt: existingOrder.paymentVerifiedAt,
        currency: existingOrder.currency,
        subtotalAmount: toPriceString(existingOrder.subtotalAmount),
        deliveryFeeAmount: toPriceString(existingOrder.deliveryFeeAmount),
        totalAmount: toPriceString(existingOrder.totalAmount),
        customerName: existingOrder.customerName,
        customerPhone: existingOrder.customerPhone,
        customerEmail: existingOrder.customerEmail,
        customerNote: existingOrder.customerNote,
        shippingZoneKey: existingOrder.shippingZoneKey,
        shippingZoneLabel: existingOrder.shippingZoneLabel,
        shippingEtaLabel: existingOrder.shippingEtaLabel,
        createdAt: existingOrder.createdAt,
        items: existingOrder.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          unitPrice: toPriceString(item.unitPrice),
          quantity: item.quantity,
          lineTotal: toPriceString(item.lineTotal),
        })),
        address: existingOrder.address
          ? {
              country: existingOrder.address.country,
              stateRegion: existingOrder.address.stateRegion,
              townshipCity: existingOrder.address.townshipCity,
              addressLine1: existingOrder.address.addressLine1,
              addressLine2: existingOrder.address.addressLine2,
              postalCode: existingOrder.address.postalCode,
            }
          : null,
      };
    }
  }

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

        const shippingQuote = await resolveShippingQuote({
          country: input.country,
          stateRegion: input.stateRegion,
          townshipCity: input.townshipCity,
          subtotalAmount: Math.round(subtotalAmount),
        });

        const deliveryFeeAmount = shippingQuote.feeAmount;
        const totalAmount = subtotalAmount + deliveryFeeAmount;
        const paymentPolicy = resolvePaymentPolicyByZone(shippingQuote.zoneKey);
        const paymentReference = normalizeOptionalText(input.paymentReference);
        const paymentProofUrl = normalizeOptionalText(input.paymentProofUrl);

        const paymentMethod =
          paymentPolicy.method === "PREPAID_TRANSFER"
            ? PaymentMethod.PREPAID_TRANSFER
            : PaymentMethod.COD;
        const paymentStatus =
          paymentPolicy.paymentStatus === "PENDING_REVIEW"
            ? PaymentStatus.PENDING_REVIEW
            : PaymentStatus.NOT_REQUIRED;
        const effectivePaymentProofUrl = paymentPolicy.requiresProof ? paymentProofUrl : null;
        const effectivePaymentReference = paymentPolicy.requiresProof ? paymentReference : null;

        if (input.paymentMethod && input.paymentMethod !== paymentPolicy.method) {
          throw new AppError(
            "Selected payment method is not available for this delivery zone.",
            400,
            "INVALID_PAYMENT_METHOD_FOR_ZONE"
          );
        }

        if (paymentPolicy.requiresProof && !effectivePaymentProofUrl) {
          throw new AppError(
            "Payment proof is required for prepaid transfer orders.",
            400,
            "PAYMENT_PROOF_REQUIRED"
          );
        }

        if (paymentPolicy.requiresProof) {
          const transferMethodCode = extractTransferMethodCode(effectivePaymentReference);
          if (!transferMethodCode) {
            throw new AppError(
              "Transfer method is required for prepaid transfer orders.",
              400,
              "TRANSFER_METHOD_REQUIRED"
            );
          }

          await assertActivePaymentTransferMethodByCode(transferMethodCode);
        }

        const now = new Date();
        const orderCode = createOrderCode(now);

        const created = await tx.order.create({
          data: {
            orderCode,
            idempotencyKey: options?.idempotencyKey,
            status: OrderStatus.PENDING,
            paymentMethod,
            paymentStatus,
            paymentProofUrl: effectivePaymentProofUrl,
            paymentReference: effectivePaymentReference,
            paymentSubmittedAt: effectivePaymentProofUrl ? now : null,
            paymentVerifiedAt: null,
            currency: cart.currency,
            subtotalAmount: subtotalAmount.toFixed(2),
            deliveryFeeAmount: deliveryFeeAmount.toFixed(2),
            shippingZoneKey: shippingQuote.zoneKey,
            shippingZoneLabel: shippingQuote.zoneLabel,
            shippingEtaLabel: shippingQuote.etaLabel,
            totalAmount: totalAmount.toFixed(2),
            customerName: input.customerName.trim(),
            customerPhone: input.customerPhone.trim(),
            customerEmail: normalizeOptionalText(input.customerEmail),
            customerNote: normalizeOptionalText(input.customerNote),
            address: {
              create: {
                country: input.country,
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
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentProofUrl: order.paymentProofUrl,
        paymentReference: order.paymentReference,
        paymentSubmittedAt: order.paymentSubmittedAt,
        paymentVerifiedAt: order.paymentVerifiedAt,
        currency: order.currency,
        subtotalAmount: toPriceString(order.subtotalAmount),
        deliveryFeeAmount: toPriceString(order.deliveryFeeAmount),
        totalAmount: toPriceString(order.totalAmount),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        customerNote: order.customerNote,
        shippingZoneKey: order.shippingZoneKey,
        shippingZoneLabel: order.shippingZoneLabel,
        shippingEtaLabel: order.shippingEtaLabel,
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
      const isIdempotencyConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        options?.idempotencyKey;

      if (isIdempotencyConflict) {
        const existingOrder = await prisma.order.findUnique({
          where: { idempotencyKey: options?.idempotencyKey },
          include: {
            address: true,
            items: true,
          },
        });

        if (existingOrder) {
          return {
            id: existingOrder.id,
            orderCode: existingOrder.orderCode,
            status: existingOrder.status,
            paymentMethod: existingOrder.paymentMethod,
            paymentStatus: existingOrder.paymentStatus,
            paymentProofUrl: existingOrder.paymentProofUrl,
            paymentReference: existingOrder.paymentReference,
            paymentSubmittedAt: existingOrder.paymentSubmittedAt,
            paymentVerifiedAt: existingOrder.paymentVerifiedAt,
            currency: existingOrder.currency,
            subtotalAmount: toPriceString(existingOrder.subtotalAmount),
            deliveryFeeAmount: toPriceString(existingOrder.deliveryFeeAmount),
            totalAmount: toPriceString(existingOrder.totalAmount),
            customerName: existingOrder.customerName,
            customerPhone: existingOrder.customerPhone,
            customerEmail: existingOrder.customerEmail,
            customerNote: existingOrder.customerNote,
            shippingZoneKey: existingOrder.shippingZoneKey,
            shippingZoneLabel: existingOrder.shippingZoneLabel,
            shippingEtaLabel: existingOrder.shippingEtaLabel,
            createdAt: existingOrder.createdAt,
            items: existingOrder.items.map((item) => ({
              id: item.id,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              unitPrice: toPriceString(item.unitPrice),
              quantity: item.quantity,
              lineTotal: toPriceString(item.lineTotal),
            })),
            address: existingOrder.address
              ? {
                  country: existingOrder.address.country,
                  stateRegion: existingOrder.address.stateRegion,
                  townshipCity: existingOrder.address.townshipCity,
                  addressLine1: existingOrder.address.addressLine1,
                  addressLine2: existingOrder.address.addressLine2,
                  postalCode: existingOrder.address.postalCode,
                }
              : null,
          };
        }
      }

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
