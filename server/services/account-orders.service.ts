import { prisma } from "@/lib/prisma";
import {
  decodeAccountOrdersCursor,
  encodeAccountOrdersCursor,
  type AccountOrdersResponse,
} from "@/lib/contracts/account-orders";
import { AppError } from "@/server/errors";

type ListAccountOrdersInput = {
  customerId: string;
  pageSize: number;
  cursor?: string;
};

function toPriceString(value: unknown): string {
  if (value && typeof value === "object" && "toString" in value) {
    return value.toString();
  }
  return String(value);
}

export async function listAccountOrders(input: ListAccountOrdersInput): Promise<AccountOrdersResponse> {
  const decodedCursor = input.cursor ? decodeAccountOrdersCursor(input.cursor) : null;
  if (input.cursor && !decodedCursor) {
    throw new AppError("Invalid pagination cursor.", 400, "INVALID_CURSOR");
  }

  const cursorDate = decodedCursor ? new Date(decodedCursor.createdAt) : null;

  const orders = await prisma.order.findMany({
    where: {
      customerId: input.customerId,
      ...(decodedCursor
        ? {
            OR: [
              { createdAt: { lt: cursorDate! } },
              {
                AND: [{ createdAt: cursorDate! }, { id: { lt: decodedCursor.id } }],
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: input.pageSize + 1,
    select: {
      id: true,
      orderCode: true,
      status: true,
      paymentStatus: true,
      currency: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  const hasMore = orders.length > input.pageSize;
  const pageOrders = hasMore ? orders.slice(0, input.pageSize) : orders;
  const orderIds = pageOrders.map((order) => order.id);

  const itemCounts = orderIds.length
    ? await prisma.orderItem.groupBy({
        by: ["orderId"],
        where: { orderId: { in: orderIds } },
        _sum: { quantity: true },
      })
    : [];

  const itemCountMap = new Map(itemCounts.map((entry) => [entry.orderId, entry._sum.quantity ?? 0]));

  const summaries = pageOrders.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    totalAmount: toPriceString(order.totalAmount),
    itemCount: itemCountMap.get(order.id) ?? 0,
    createdAt: order.createdAt.toISOString(),
  }));

  const lastOrder = summaries[summaries.length - 1];
  const nextCursor = hasMore && lastOrder
    ? encodeAccountOrdersCursor({
        v: 1,
        createdAt: lastOrder.createdAt,
        id: lastOrder.id,
      })
    : null;

  return {
    orders: summaries,
    nextCursor,
    hasMore,
    pageSize: input.pageSize,
  };
}

