import { attachCartCookie, resolveCartSession } from "@/lib/cart-session";
import { routeErrorResponse } from "@/lib/api/route-error";
import {
  addCartItemSchema,
  removeCartItemSchema,
  setCartItemQuantitySchema,
} from "@/lib/validation/cart";
import {
  addCartItem,
  getCartByToken,
  removeCartItem,
  setCartItemQuantity,
} from "@/server/services/cart.service";
import { NextResponse } from "next/server";

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
    return routeErrorResponse(error, { request, route: "api/cart#GET" });
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
    return routeErrorResponse(error, { request, route: "api/cart#POST" });
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
    return routeErrorResponse(error, { request, route: "api/cart#PATCH" });
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
    return routeErrorResponse(error, { request, route: "api/cart#DELETE" });
  }
}
