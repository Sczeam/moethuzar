import { PutObjectCommand } from "@aws-sdk/client-s3";
import { routeErrorResponse } from "@/lib/api/route-error";
import { buildR2PublicUrl, createR2Client, getR2Env } from "@/lib/r2";
import { requireAdminUserId } from "@/server/auth/admin";
import { AppError } from "@/server/errors";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function extensionFromMime(mimeType: string): string {
  if (mimeType === "image/png") {
    return "png";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/avif") {
    return "avif";
  }
  return "jpg";
}

export async function POST(request: Request) {
  try {
    await requireAdminUserId(request);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new AppError("Image file is required.", 400, "FILE_REQUIRED");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new AppError("Unsupported image format.", 400, "INVALID_FILE_TYPE");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError("Image exceeds max size (8 MB).", 400, "FILE_TOO_LARGE");
    }

    const ext = extensionFromMime(file.type);
    const key = `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
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
