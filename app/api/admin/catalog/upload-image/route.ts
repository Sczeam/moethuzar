import { PutObjectCommand } from "@aws-sdk/client-s3";
import { routeErrorResponse } from "@/lib/api/route-error";
import { buildR2PublicUrl, createR2Client, getR2Env } from "@/lib/r2";
import { generateProductImageKey, validateR2UploadInput } from "@/lib/r2-upload";
import { requireAdminUserId } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("Image file is required.", 400, "FILE_REQUIRED");
    }

    validateR2UploadInput(file.type, file.size);
    const key = generateProductImageKey(file.type);
    const body = Buffer.from(await file.arrayBuffer());
    const client = createR2Client();
    const { bucket } = getR2Env();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
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
    return routeErrorResponse(error, { request, route: "api/admin/catalog/upload-image#POST" });
  }
}
