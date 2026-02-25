import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export const ORDER_ACTION_IDS = [
  "payment.verify",
  "payment.reject",
  "status.confirm",
  "status.mark_delivering",
  "status.mark_delivered",
  "status.cancel",
] as const;

export type OrderActionId = (typeof ORDER_ACTION_IDS)[number];

export type CopyKey =
  | "action.payment.verify"
  | "action.payment.reject"
  | "action.status.confirm"
  | "action.status.mark_delivering"
  | "action.status.mark_delivered"
  | "action.status.cancel"
  | "blocked.payment.not_prepaid_transfer"
  | "blocked.payment.proof_missing"
  | "blocked.payment.review_not_pending"
  | "blocked.status.transition_invalid"
  | "blocked.status.already_terminal"
  | "confirm.payment.verify.title"
  | "confirm.payment.verify.body"
  | "confirm.payment.reject.title"
  | "confirm.payment.reject.body"
  | "confirm.status.confirm.title"
  | "confirm.status.confirm.body"
  | "confirm.status.mark_delivering.title"
  | "confirm.status.mark_delivering.body"
  | "confirm.status.mark_delivered.title"
  | "confirm.status.mark_delivered.body"
  | "confirm.status.cancel.title"
  | "confirm.status.cancel.body"
  | "success.payment.verified"
  | "success.payment.rejected"
  | "success.status.confirmed"
  | "success.status.delivering"
  | "success.status.delivered"
  | "success.status.cancelled"
  | "error.action.generic"
  | "error.action.invalid_transition";

export const COPY_TEXT: Record<CopyKey, string> = {
  "action.payment.verify": "Approve Payment",
  "action.payment.reject": "Reject Payment",
  "action.status.confirm": "Confirm Order",
  "action.status.mark_delivering": "Mark Delivering",
  "action.status.mark_delivered": "Mark Delivered",
  "action.status.cancel": "Cancel Order",
  "blocked.payment.not_prepaid_transfer": "Payment review is only available for prepaid transfer orders.",
  "blocked.payment.proof_missing": "Payment proof is missing. Ask customer to resubmit transfer screenshot.",
  "blocked.payment.review_not_pending": "Payment is already reviewed and cannot be reviewed again.",
  "blocked.status.transition_invalid": "This status change is not allowed from the current state.",
  "blocked.status.already_terminal": "This order is already in a final state.",
  "confirm.payment.verify.title": "Approve this payment?",
  "confirm.payment.verify.body": "This will mark payment as verified so fulfillment can continue.",
  "confirm.payment.reject.title": "Reject this payment?",
  "confirm.payment.reject.body": "This will mark payment as rejected and the customer will need to retry.",
  "confirm.status.confirm.title": "Confirm this order?",
  "confirm.status.confirm.body": "Use this after customer confirmation. Inventory stays reserved.",
  "confirm.status.mark_delivering.title": "Mark as delivering?",
  "confirm.status.mark_delivering.body": "Use this when the package is handed to delivery.",
  "confirm.status.mark_delivered.title": "Mark as delivered?",
  "confirm.status.mark_delivered.body": "Use this after successful handoff and COD collection.",
  "confirm.status.cancel.title": "Cancel this order?",
  "confirm.status.cancel.body": "This will cancel the order and restore reserved inventory.",
  "success.payment.verified": "Payment marked as verified.",
  "success.payment.rejected": "Payment marked as rejected.",
  "success.status.confirmed": "Order marked as confirmed.",
  "success.status.delivering": "Order marked as delivering.",
  "success.status.delivered": "Order marked as delivered.",
  "success.status.cancelled": "Order marked as cancelled.",
  "error.action.generic": "Unable to complete this action. Please retry.",
  "error.action.invalid_transition": "This action is no longer valid for the current order state.",
};

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const STATUS_ACTION_BY_TARGET: Record<OrderStatus, OrderActionId | null> = {
  [OrderStatus.PENDING]: null,
  [OrderStatus.CONFIRMED]: "status.confirm",
  [OrderStatus.DELIVERING]: "status.mark_delivering",
  [OrderStatus.DELIVERED]: "status.mark_delivered",
  [OrderStatus.CANCELLED]: "status.cancel",
};

type BlockedAction = {
  actionId: OrderActionId;
  reasonKey: CopyKey;
};

export type ActionDescriptor = {
  actionId: OrderActionId;
  labelKey: CopyKey;
  confirmTitleKey: CopyKey;
  confirmBodyKey: CopyKey;
  successMessageKey: CopyKey;
  requiresNote: boolean;
};

export const ACTION_DESCRIPTORS: Record<OrderActionId, ActionDescriptor> = {
  "payment.verify": {
    actionId: "payment.verify",
    labelKey: "action.payment.verify",
    confirmTitleKey: "confirm.payment.verify.title",
    confirmBodyKey: "confirm.payment.verify.body",
    successMessageKey: "success.payment.verified",
    requiresNote: false,
  },
  "payment.reject": {
    actionId: "payment.reject",
    labelKey: "action.payment.reject",
    confirmTitleKey: "confirm.payment.reject.title",
    confirmBodyKey: "confirm.payment.reject.body",
    successMessageKey: "success.payment.rejected",
    requiresNote: false,
  },
  "status.confirm": {
    actionId: "status.confirm",
    labelKey: "action.status.confirm",
    confirmTitleKey: "confirm.status.confirm.title",
    confirmBodyKey: "confirm.status.confirm.body",
    successMessageKey: "success.status.confirmed",
    requiresNote: false,
  },
  "status.mark_delivering": {
    actionId: "status.mark_delivering",
    labelKey: "action.status.mark_delivering",
    confirmTitleKey: "confirm.status.mark_delivering.title",
    confirmBodyKey: "confirm.status.mark_delivering.body",
    successMessageKey: "success.status.delivering",
    requiresNote: false,
  },
  "status.mark_delivered": {
    actionId: "status.mark_delivered",
    labelKey: "action.status.mark_delivered",
    confirmTitleKey: "confirm.status.mark_delivered.title",
    confirmBodyKey: "confirm.status.mark_delivered.body",
    successMessageKey: "success.status.delivered",
    requiresNote: false,
  },
  "status.cancel": {
    actionId: "status.cancel",
    labelKey: "action.status.cancel",
    confirmTitleKey: "confirm.status.cancel.title",
    confirmBodyKey: "confirm.status.cancel.body",
    successMessageKey: "success.status.cancelled",
    requiresNote: true,
  },
};

export type OrderActionContractInput = {
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  hasPaymentProof: boolean;
};

export type OrderActionContract = {
  allowedActions: OrderActionId[];
  recommendedAction: OrderActionId | null;
  blockedActions: BlockedAction[];
};

function allowedStatusActions(orderStatus: OrderStatus): OrderActionId[] {
  const targets = ORDER_STATUS_TRANSITIONS[orderStatus];
  return targets
    .map((status) => STATUS_ACTION_BY_TARGET[status])
    .filter((action): action is OrderActionId => action !== null);
}

function paymentActionState(input: OrderActionContractInput): {
  allowed: OrderActionId[];
  blocked: BlockedAction[];
} {
  if (input.paymentMethod !== PaymentMethod.PREPAID_TRANSFER) {
    return {
      allowed: [],
      blocked: [
        {
          actionId: "payment.verify",
          reasonKey: "blocked.payment.not_prepaid_transfer",
        },
        {
          actionId: "payment.reject",
          reasonKey: "blocked.payment.not_prepaid_transfer",
        },
      ],
    };
  }

  if (!input.hasPaymentProof) {
    return {
      allowed: [],
      blocked: [
        {
          actionId: "payment.verify",
          reasonKey: "blocked.payment.proof_missing",
        },
        {
          actionId: "payment.reject",
          reasonKey: "blocked.payment.proof_missing",
        },
      ],
    };
  }

  if (input.paymentStatus !== PaymentStatus.PENDING_REVIEW) {
    return {
      allowed: [],
      blocked: [
        {
          actionId: "payment.verify",
          reasonKey: "blocked.payment.review_not_pending",
        },
        {
          actionId: "payment.reject",
          reasonKey: "blocked.payment.review_not_pending",
        },
      ],
    };
  }

  return {
    allowed: ["payment.verify", "payment.reject"],
    blocked: [],
  };
}

export function buildOrderActionContract(input: OrderActionContractInput): OrderActionContract {
  const statusActions = allowedStatusActions(input.orderStatus);
  const paymentActions = paymentActionState(input);

  const allowedActions: OrderActionId[] = [...paymentActions.allowed, ...statusActions];
  const blockedActions: BlockedAction[] = [...paymentActions.blocked];

  if (statusActions.length === 0) {
    blockedActions.push(
      {
        actionId: "status.confirm",
        reasonKey: "blocked.status.already_terminal",
      },
      {
        actionId: "status.mark_delivering",
        reasonKey: "blocked.status.already_terminal",
      },
      {
        actionId: "status.mark_delivered",
        reasonKey: "blocked.status.already_terminal",
      },
      {
        actionId: "status.cancel",
        reasonKey: "blocked.status.already_terminal",
      },
    );
  }

  const recommendedAction =
    paymentActions.allowed[0] ??
    statusActions[0] ??
    null;

  return {
    allowedActions,
    recommendedAction,
    blockedActions,
  };
}
