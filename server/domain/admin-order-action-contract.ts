import {
  type OrderActionId,
  type BlockedAction,
  type OrderActionContract,
} from "@/lib/constants/admin-order-action-contract";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

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

export type OrderActionContractInput = {
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  hasPaymentProof: boolean;
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
