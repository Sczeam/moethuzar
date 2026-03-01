export const ADMIN_VALIDATION_FIELDS = {
  shipping: {
    zone: "Zone",
    shippingFee: "Shipping fee",
    freeShippingThreshold: "Free-shipping threshold",
    deliveryEta: "Delivery ETA",
  },
  paymentMethod: {
    methodLabel: "Method label",
    accountName: "Account name",
    accountNumber: "Account number",
    phoneNumber: "Phone number",
    methodCode: "Method code",
  },
} as const;

export const ADMIN_VALIDATION_COPY = {
  required: (fieldLabel: string) => `${fieldLabel} is required.`,
  requiredFor: (fieldLabel: string, contextLabel: string) =>
    `${fieldLabel} is required for ${contextLabel}.`,
  wholeMmkAmount: (fieldLabel: string) => `${fieldLabel} must be a whole MMK amount.`,
  maxLength: (fieldLabel: string, limit: number) =>
    `${fieldLabel} is too long. Keep it under ${limit} characters.`,
} as const;
