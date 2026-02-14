import { attachCartCookie, resolveCartSession } from "@/lib/cart-session";
import {
  addCartItemSchema,
  removeCartItemSchema,
  setCartItemQuantitySchema,
} from "@/lib/validation/cart";
import { AppError } from "@/server/errors";
import {
  addCartItem,
  getCartByToken,
  removeCartItem,
  setCartItemQuantity,
} from "@/server/services/cart.service";
import { ZodError } from "zod";
import { NextResponse } from "next/server";

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Invalid request payload.",
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

export async function GET(request: Request) {
  try {
    const session = resolveCartSession(request);
    const cart = await getCartByToken(session.token);
    const response = NextResponse.json({ ok: true, cart }, { status: 200 });

    if (session.isNew) {
      attachCartCookie(response, session.token);
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = resolveCartSession(request);
    const payload = addCartItemSchema.parse(await request.json());
    const cart = await addCartItem(session.token, payload);
    const response = NextResponse.json({ ok: true, cart }, { status: 200 });

    if (session.isNew) {
      attachCartCookie(response, session.token);
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = resolveCartSession(request);
    const payload = setCartItemQuantitySchema.parse(await request.json());
    const cart = await setCartItemQuantity(session.token, payload);
    const response = NextResponse.json({ ok: true, cart }, { status: 200 });

    if (session.isNew) {
      attachCartCookie(response, session.token);
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = resolveCartSession(request);
    const payload = removeCartItemSchema.parse(await request.json());
    const cart = await removeCartItem(session.token, payload);
    const response = NextResponse.json({ ok: true, cart }, { status: 200 });

    if (session.isNew) {
      attachCartCookie(response, session.token);
    }

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
