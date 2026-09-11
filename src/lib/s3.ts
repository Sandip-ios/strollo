import { S3Client } from "@aws-sdk/client-s3";

// Named S3_* rather than AWS_* — Netlify reserves the AWS_REGION /
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY names for its own Lambda
// runtime internals and refuses to let them be set from the dashboard.
export const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      }
    : undefined,
});

export const S3_BUCKET = process.env.S3_BUCKET as string;

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_REGION && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);
}

export function publicObjectUrl(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}
