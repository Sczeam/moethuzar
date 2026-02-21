import { logInfo } from "@/lib/observability";

type PaymentReviewOutcome = "VERIFIED" | "REJECTED";

type PaymentReviewHookInput = {
  orderId: string;
  orderCode: string;
  outcome: PaymentReviewOutcome;
  adminUserId: string;
};

// Hook point for future integrations (email/SMS/Telegram).
export async function emitPaymentReviewHook(input: PaymentReviewHookInput) {
  logInfo({
    event: "payment.review_hook_enqueued",
    orderId: input.orderId,
    orderCode: input.orderCode,
    outcome: input.outcome,
    adminUserId: input.adminUserId,
  });
}

