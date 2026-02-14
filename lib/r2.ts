import { S3Client } from "@aws-sdk/client-s3";

type R2Env = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

function missingEnv(name: string): never {
  throw new Error(`Missing R2 environment variable: ${name}`);
}

export function getR2Env(): R2Env {
  const accountId = process.env.R2_ACCOUNT_ID || missingEnv("R2_ACCOUNT_ID");
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || missingEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || missingEnv("R2_SECRET_ACCESS_KEY");
  const bucket = process.env.R2_BUCKET || missingEnv("R2_BUCKET");
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || missingEnv("R2_PUBLIC_BASE_URL");

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
  };
}

export function createR2Client() {
  const env = getR2Env();

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  });
}

export function buildR2PublicUrl(key: string): string {
  const { publicBaseUrl } = getR2Env();
  const trimmedBase = publicBaseUrl.replace(/\/+$/, "");
  const trimmedKey = key.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedKey}`;
}
