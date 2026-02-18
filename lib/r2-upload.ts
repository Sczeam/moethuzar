import { AppError } from "@/server/errors";

export const MAX_R2_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
export const ALLOWED_R2_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function extensionFromImageMimeType(mimeType: string): string {
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

export function validateR2UploadInput(fileType: string, fileSize: number) {
  if (!ALLOWED_R2_IMAGE_MIME_TYPES.has(fileType)) {
    throw new AppError("Unsupported image format.", 400, "INVALID_FILE_TYPE");
  }

  if (fileSize > MAX_R2_IMAGE_SIZE_BYTES) {
    throw new AppError("Image exceeds max size (8 MB).", 400, "FILE_TOO_LARGE");
  }
}

export function generateProductImageKey(fileType: string): string {
  const ext = extensionFromImageMimeType(fileType);
  return `products/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
}
