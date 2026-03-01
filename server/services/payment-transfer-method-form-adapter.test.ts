import { describe, expect, it } from "vitest";
import {
  createPaymentTransferMethodFormDraft,
  maskPaymentDestination,
  nextMethodSortOrder,
  paymentTransferMethodToDraft,
  toPaymentTransferMethodPayload,
  withChannelType,
} from "@/lib/admin/payment-transfer-method-form-adapter";

describe("payment-transfer-method-form-adapter", () => {
  it("creates default draft with next sort order", () => {
    const draft = createPaymentTransferMethodFormDraft(7);
    expect(draft.sortOrder).toBe("7");
    expect(draft.channelType).toBe("BANK");
  });

  it("maps record to draft", () => {
    const draft = paymentTransferMethodToDraft({
      id: "a",
      methodCode: "KBZ_PAY",
      label: "KBZ Pay",
      channelType: "WALLET",
      accountName: "Moethuzar",
      accountNumber: null,
      phoneNumber: "0912345678",
      instructions: "Use order code",
      isActive: true,
      sortOrder: 3,
    });
    expect(draft.channelType).toBe("WALLET");
    expect(draft.phoneNumber).toBe("0912345678");
  });

  it("enforces bank/wallet required fields", () => {
    const bank = toPaymentTransferMethodPayload(
      {
        ...createPaymentTransferMethodFormDraft(1),
        label: "AYA Bank",
        accountName: "Moethuzar",
        channelType: "BANK",
        accountNumber: "",
      },
      1,
    );
    expect(bank.ok).toBe(false);

    const wallet = toPaymentTransferMethodPayload(
      {
        ...createPaymentTransferMethodFormDraft(1),
        label: "KBZPay",
        accountName: "Moethuzar",
        channelType: "WALLET",
        phoneNumber: "",
      },
      1,
    );
    expect(wallet.ok).toBe(false);
  });

  it("maps to payload and auto-derives method code", () => {
    const mapped = toPaymentTransferMethodPayload(
      {
        ...createPaymentTransferMethodFormDraft(2),
        label: "KBZ Pay",
        accountName: "Moethuzar Tun",
        channelType: "WALLET",
        phoneNumber: "0912345678",
      },
      2,
    );
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.payload.methodCode).toBe("KBZ_PAY_WALLET");
      expect(mapped.payload.sortOrder).toBe(2);
    }
  });

  it("preserves existing method code on edit payload mapping", () => {
    const mapped = toPaymentTransferMethodPayload(
      {
        ...createPaymentTransferMethodFormDraft(2),
        methodCode: "KBZ-PAY",
        label: "KBZ Pay Updated Label",
        accountName: "Moethuzar Tun",
        channelType: "WALLET",
        phoneNumber: "0912345678",
      },
      2,
      { preserveMethodCode: true },
    );
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.payload.methodCode).toBe("KBZ-PAY");
    }
  });

  it("caps generated method code to backend max length", () => {
    const mapped = toPaymentTransferMethodPayload(
      {
        ...createPaymentTransferMethodFormDraft(4),
        label: "x".repeat(120),
        accountName: "Moethuzar",
        channelType: "BANK",
        accountNumber: "123456",
      },
      4,
    );
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.payload.methodCode.length).toBeLessThanOrEqual(64);
    }
  });

  it("resets opposite channel field on channel switch", () => {
    const switched = withChannelType(
      {
        ...createPaymentTransferMethodFormDraft(1),
        channelType: "BANK",
        accountNumber: "12345",
        phoneNumber: "0911",
      },
      "WALLET",
    );
    expect(switched.accountNumber).toBe("");
    expect(switched.phoneNumber).toBe("0911");
  });

  it("calculates next sort order", () => {
    expect(
      nextMethodSortOrder([
        {
          id: "a",
          methodCode: "A",
          label: "A",
          channelType: "BANK",
          accountName: "A",
          accountNumber: "1",
          phoneNumber: null,
          instructions: null,
          isActive: true,
          sortOrder: 4,
        },
      ]),
    ).toBe(5);
  });

  it("masks destination", () => {
    expect(maskPaymentDestination("1234567890")).toBe("****7890");
    expect(maskPaymentDestination("123")).toBe("123");
    expect(maskPaymentDestination(null)).toBe("-");
  });
});
