import { DEFAULT_PREPAID_TRANSFER_METHODS } from "@/lib/constants/prepaid-transfer-methods";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { Prisma, TransferChannelType } from "@prisma/client";
import type { PaymentTransferMethodPayloadInput } from "@/lib/validation/payment-transfer-method";

function normalizeOptionalText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeMethodCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function toPublicShape(method: {
  id: string;
  methodCode: string;
  label: string;
  channelType: TransferChannelType;
  accountName: string;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
}) {
  return {
    id: method.id,
    methodCode: method.methodCode,
    label: method.label,
    channelType: method.channelType,
    accountName: method.accountName,
    accountNumber: method.accountNumber,
    phoneNumber: method.phoneNumber,
    instructions: method.instructions,
    isActive: method.isActive,
    sortOrder: method.sortOrder,
  };
}

export async function listAdminPaymentTransferMethods() {
  return prisma.paymentTransferMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function listPublicPaymentTransferMethods() {
  try {
    const methods = await prisma.paymentTransferMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        methodCode: true,
        label: true,
        channelType: true,
        accountName: true,
        accountNumber: true,
        phoneNumber: true,
        instructions: true,
        isActive: true,
        sortOrder: true,
      },
    });

    return methods.map(toPublicShape);
  } catch (error) {
    const isMissingTable =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022");

    if (isMissingTable) {
      return DEFAULT_PREPAID_TRANSFER_METHODS.map((method, index) => ({
        id: `fallback-${method.methodCode}`,
        methodCode: method.methodCode,
        label: method.label,
        channelType: method.channelType,
        accountName: method.accountName,
        accountNumber: method.accountNumber ?? null,
        phoneNumber: method.phoneNumber ?? null,
        instructions: method.instructions ?? null,
        isActive: method.isActive ?? true,
        sortOrder: method.sortOrder ?? index + 1,
      }));
    }

    throw error;
  }
}

export async function getPaymentTransferMethodById(methodId: string) {
  const method = await prisma.paymentTransferMethod.findUnique({
    where: { id: methodId },
  });
  if (!method) {
    throw new AppError("Payment transfer method not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  return method;
}

function toTransferChannelType(channelType: PaymentTransferMethodPayloadInput["channelType"]) {
  return channelType === "BANK" ? TransferChannelType.BANK : TransferChannelType.WALLET;
}

export async function createPaymentTransferMethod(input: PaymentTransferMethodPayloadInput) {
  return prisma.paymentTransferMethod.create({
    data: {
      methodCode: normalizeMethodCode(input.methodCode),
      label: input.label.trim(),
      channelType: toTransferChannelType(input.channelType),
      accountName: input.accountName.trim(),
      accountNumber: normalizeOptionalText(input.accountNumber),
      phoneNumber: normalizeOptionalText(input.phoneNumber),
      instructions: normalizeOptionalText(input.instructions),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updatePaymentTransferMethod(
  methodId: string,
  input: PaymentTransferMethodPayloadInput
) {
  const existing = await prisma.paymentTransferMethod.findUnique({ where: { id: methodId } });
  if (!existing) {
    throw new AppError("Payment transfer method not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  return prisma.paymentTransferMethod.update({
    where: { id: methodId },
    data: {
      methodCode: normalizeMethodCode(input.methodCode),
      label: input.label.trim(),
      channelType: toTransferChannelType(input.channelType),
      accountName: input.accountName.trim(),
      accountNumber: normalizeOptionalText(input.accountNumber),
      phoneNumber: normalizeOptionalText(input.phoneNumber),
      instructions: normalizeOptionalText(input.instructions),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deletePaymentTransferMethod(methodId: string) {
  const existing = await prisma.paymentTransferMethod.findUnique({ where: { id: methodId } });
  if (!existing) {
    throw new AppError("Payment transfer method not found.", 404, "PAYMENT_METHOD_NOT_FOUND");
  }

  await prisma.paymentTransferMethod.delete({ where: { id: methodId } });
}

export async function assertActivePaymentTransferMethodByCode(methodCode: string) {
  const normalizedCode = normalizeMethodCode(methodCode);
  let method:
    | {
        id: string;
        methodCode: string;
      }
    | null = null;

  try {
    method = await prisma.paymentTransferMethod.findFirst({
      where: {
        methodCode: normalizedCode,
        isActive: true,
      },
      select: { id: true, methodCode: true },
    });
  } catch (error) {
    const isMissingTable =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022");

    if (!isMissingTable) {
      throw error;
    }

    const fallback = DEFAULT_PREPAID_TRANSFER_METHODS.find(
      (entry) => normalizeMethodCode(entry.methodCode) === normalizedCode && (entry.isActive ?? true)
    );

    if (fallback) {
      return {
        id: `fallback-${fallback.methodCode}`,
        methodCode: normalizeMethodCode(fallback.methodCode),
      };
    }
  }

  if (!method) {
    throw new AppError(
      "Selected transfer method is unavailable. Please refresh and try again.",
      400,
      "INVALID_TRANSFER_METHOD"
    );
  }

  return method;
}
