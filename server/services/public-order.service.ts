import { prisma } from "@/lib/prisma";

export async function getPublicOrderByCode(orderCode: string) {
  return prisma.order.findUnique({
    where: { orderCode },
    select: {
      id: true,
      orderCode: true,
      status: true,
      currency: true,
      subtotalAmount: true,
      deliveryFeeAmount: true,
      shippingZoneKey: true,
      shippingZoneLabel: true,
      shippingEtaLabel: true,
      totalAmount: true,
      customerName: true,
      customerPhone: true,
      customerNote: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          sku: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
}
