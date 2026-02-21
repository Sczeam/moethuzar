export type PrepaidTransferMethod = {
  id?: string;
  methodCode: string;
  label: string;
  channelType: "BANK" | "WALLET";
  accountName: string;
  accountNumber?: string;
  phoneNumber?: string;
  instructions?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export const DEFAULT_PREPAID_TRANSFER_METHODS: PrepaidTransferMethod[] = [
  {
    methodCode: "KBZ_BANK",
    label: "KBZ Bank",
    channelType: "BANK",
    accountName: "Moe Thuzar Tun",
    accountNumber: "849842485283457",
    isActive: true,
    sortOrder: 1,
  },
  {
    methodCode: "KBZ_PAY",
    label: "KBZPay",
    channelType: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 123 456 789",
    isActive: true,
    sortOrder: 2,
  },
  {
    methodCode: "WAVE_PAY",
    label: "WavePay",
    channelType: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 234 567 890",
    isActive: true,
    sortOrder: 3,
  },
  {
    methodCode: "AYA_PAY",
    label: "AyaPay",
    channelType: "WALLET",
    accountName: "Moe Thuzar Tun",
    phoneNumber: "09 345 678 901",
    isActive: true,
    sortOrder: 4,
  },
];
