export type PrepaidTransferMethod = {
  id: string;
  label: string;
  type: "BANK" | "WALLET";
  accountName: string;
  accountNumber?: string;
  phoneNumber?: string;
};

export const PREPAID_TRANSFER_METHODS: PrepaidTransferMethod[] = [
  {
    id: "KBZ_BANK",
    label: "KBZ Bank",
    type: "BANK",
    accountName: "Moe Thuzar Tun",
    accountNumber: "849842485283457",
  },
  {
    id: "KBZ_PAY",
    label: "KBZPay",
    type: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 123 456 789",
  },
  {
    id: "WAVE_PAY",
    label: "WavePay",
    type: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 234 567 890",
  },
  {
    id: "AYA_PAY",
    label: "AyaPay",
    type: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 345 678 901",
  },
];
