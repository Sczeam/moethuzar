import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { resolveCartSession } from "@/lib/cart-session";
import { routeErrorResponse } from "@/lib/api/route-error";
import { buildR2PublicUrl, createR2Client, getR2Env } from "@/lib/r2";
import { generatePaymentProofImageKey, validateR2UploadInput } from "@/lib/r2-upload";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { CartStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const limitedResponse = rateLimitOrResponse(request, "checkout");
    if (limitedResponse) {
      return limitedResponse;
    }

    const session = resolveCartSession(request);
    const cart = await prisma.cart.findUnique({
      where: { guestToken: session.token },
      select: { id: true, status: true },
    });

    if (!cart || cart.status !== CartStatus.ACTIVE) {
      throw new AppError("Active cart not found for payment proof upload.", 404, "CART_NOT_FOUND");
    }

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("Payment proof image is required.", 400, "FILE_REQUIRED");
    }

    validateR2UploadInput(file.type, file.size);

    const key = generatePaymentProofImageKey(file.type, session.token);
    const body = Buffer.from(await file.arrayBuffer());
    const client = createR2Client();
    const { bucket } = getR2Env();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
        CacheControl: "private, max-age=0, no-store",
      })
    );

    return NextResponse.json(
      {
        ok: true,
        key,
        url: buildR2PublicUrl(key),
      },
      { status: 201 }
    );
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/checkout/payment-proof/upload#POST",
    });
  }
}
