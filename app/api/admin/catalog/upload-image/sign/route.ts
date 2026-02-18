import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { routeErrorResponse } from "@/lib/api/route-error";
import { buildR2PublicUrl, createR2Client, getR2Env } from "@/lib/r2";
import { generateProductImageKey, validateR2UploadInput } from "@/lib/r2-upload";
import { requireAdminUserId } from "@/server/auth/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const signUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileType: z.string().trim().min(1).max(64),
  fileSize: z.number().int().min(1),
});

const SIGNED_UPLOAD_EXPIRY_SECONDS = 120;

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);
    const payload = signUploadSchema.parse(await request.json());

    validateR2UploadInput(payload.fileType, payload.fileSize);

    const key = generateProductImageKey(payload.fileType);
    const client = createR2Client();
    const { bucket } = getR2Env();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: payload.fileType,
      CacheControl: "public, max-age=31536000, immutable",
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
      route: "api/admin/catalog/upload-image/sign#POST",
    });
  }
}
