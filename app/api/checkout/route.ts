import { attachCartCookie, resolveCartSession } from "@/lib/cart-session";
import { checkoutSchema } from "@/lib/validation/checkout";
import { AppError } from "@/server/errors";
import { createOrderFromCart } from "@/server/services/order.service";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const idempotencyKeySchema = z.string().uuid();

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Invalid checkout payload.",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        error: error.message,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      code: "INTERNAL_ERROR",
      error: "Unexpected server error.",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const session = resolveCartSession(request);
    const payload = checkoutSchema.parse(await request.json());
    const idempotencyHeader = request.headers.get("x-idempotency-key");
    const idempotencyKey = idempotencyHeader
      ? idempotencyKeySchema.parse(idempotencyHeader)
      : undefined;
    const order = await createOrderFromCart(session.token, payload, { idempotencyKey });

    const response = NextResponse.json(
      {
        ok: true,
        order,
      },
      { status: 201 }
    );

    // Rotate cart token after successful checkout to avoid reusing converted cart sessions.
    attachCartCookie(response, crypto.randomUUID());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
