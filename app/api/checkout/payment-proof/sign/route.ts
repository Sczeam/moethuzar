import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveCartSession } from "@/lib/cart-session";
import { routeErrorResponse } from "@/lib/api/route-error";
import { buildR2PublicUrl, createR2Client, getR2Env } from "@/lib/r2";
import { generatePaymentProofImageKey, validateR2UploadInput } from "@/lib/r2-upload";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/errors";
import { rateLimitOrResponse } from "@/server/security/rate-limit";
import { CartStatus } from "@prisma/client";

const signUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileType: z.string().trim().min(1).max(64),
  fileSize: z.number().int().min(1),
});

const SIGNED_UPLOAD_EXPIRY_SECONDS = 120;

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

    const payload = signUploadSchema.parse(await request.json());
    validateR2UploadInput(payload.fileType, payload.fileSize);

    const key = generatePaymentProofImageKey(payload.fileType, session.token);
    const client = createR2Client();
    const { bucket } = getR2Env();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: payload.fileType,
      CacheControl: "private, max-age=0, no-store",
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: SIGNED_UPLOAD_EXPIRY_SECONDS,
    });

    return NextResponse.json(
      {
        ok: true,
        key,
        uploadUrl,
        publicUrl: buildR2PublicUrl(key),
        expiresIn: SIGNED_UPLOAD_EXPIRY_SECONDS,
      },
      { status: 200 }
    );
  } catch (error) {
    return routeErrorResponse(error, {
      request,
      route: "api/checkout/payment-proof/sign#POST",
    });
  }
}
