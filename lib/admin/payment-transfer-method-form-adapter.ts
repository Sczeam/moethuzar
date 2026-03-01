export type ChannelType = "BANK" | "WALLET";

export type PaymentTransferMethodRecord = {
  id: string;
  methodCode: string;
  label: string;
  channelType: ChannelType;
  accountName: string;
  accountNumber: string | null;
  phoneNumber: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type PaymentTransferMethodFormDraft = {
  label: string;
  channelType: ChannelType;
  accountName: string;
  accountNumber: string;
  phoneNumber: string;
  instructions: string;
  isActive: boolean;
  methodCode: string;
  sortOrder: string;
};

export type PaymentTransferMethodPayload = {
  methodCode: string;
  label: string;
  channelType: ChannelType;
  accountName: string;
  accountNumber: string;
  phoneNumber: string;
  instructions: string;
  isActive: boolean;
  sortOrder: number;
};

function parseInteger(value: string) {
  if (!value.trim().length) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeMethodCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function deriveMethodCode(label: string, channelType: ChannelType, fallbackSortOrder: number) {
  const base = normalizeMethodCode(label);
  if (base.length) return `${base}_${channelType}`;
  return `METHOD_${channelType}_${fallbackSortOrder}`;
}

export function nextMethodSortOrder(methods: PaymentTransferMethodRecord[]) {
  const maxSortOrder = methods.reduce((max, method) => Math.max(max, method.sortOrder), 0);
  return maxSortOrder + 1;
}

export function createPaymentTransferMethodFormDraft(
  nextSortOrder: number,
): PaymentTransferMethodFormDraft {
  return {
    label: "",
    channelType: "BANK",
    accountName: "",
    accountNumber: "",
    phoneNumber: "",
    instructions: "",
    isActive: true,
    methodCode: "",
    sortOrder: String(nextSortOrder),
  };
}

export function paymentTransferMethodToDraft(
  method: PaymentTransferMethodRecord,
): PaymentTransferMethodFormDraft {
  return {
    label: method.label,
    channelType: method.channelType,
    accountName: method.accountName,
    accountNumber: method.accountNumber ?? "",
    phoneNumber: method.phoneNumber ?? "",
    instructions: method.instructions ?? "",
    isActive: method.isActive,
    methodCode: method.methodCode,
    sortOrder: String(method.sortOrder),
  };
}

export function toPaymentTransferMethodPayload(
  draft: PaymentTransferMethodFormDraft,
  fallbackSortOrder: number,
): { ok: true; payload: PaymentTransferMethodPayload } | { ok: false; error: string } {
  const label = draft.label.trim();
  if (label.length < 2) {
    return { ok: false, error: "Method label is required." };
  }

  const accountName = draft.accountName.trim();
  if (accountName.length < 2) {
    return { ok: false, error: "Account name is required." };
  }

  if (draft.channelType === "BANK" && !draft.accountNumber.trim()) {
    return { ok: false, error: "Account number is required for bank methods." };
  }
  if (draft.channelType === "WALLET" && !draft.phoneNumber.trim()) {
    return { ok: false, error: "Phone number is required for wallet methods." };
  }

  const sortOrder = parseInteger(draft.sortOrder) ?? fallbackSortOrder;
  const methodCode = normalizeMethodCode(draft.methodCode) || deriveMethodCode(label, draft.channelType, sortOrder);

  return {
    ok: true,
    payload: {
      methodCode,
      label,
      channelType: draft.channelType,
      accountName,
      accountNumber: draft.channelType === "BANK" ? draft.accountNumber.trim() : "",
      phoneNumber: draft.channelType === "WALLET" ? draft.phoneNumber.trim() : "",
      instructions: draft.instructions.trim(),
      isActive: draft.isActive,
      sortOrder,
    },
  };
}

export function withChannelType(
  draft: PaymentTransferMethodFormDraft,
  channelType: ChannelType,
): PaymentTransferMethodFormDraft {
  return {
    ...draft,
    channelType,
    accountNumber: channelType === "BANK" ? draft.accountNumber : "",
    phoneNumber: channelType === "WALLET" ? draft.phoneNumber : "",
  };
}

export function maskPaymentDestination(value: string | null) {
  if (!value || !value.trim()) return "-";
  const normalized = value.trim();
  if (normalized.length <= 4) return normalized;
  const last4 = normalized.slice(-4);
  return `••••${last4}`;
}
