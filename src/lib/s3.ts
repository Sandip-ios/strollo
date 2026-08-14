import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }
    : undefined,
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET as string;

export function isS3Configured(): boolean {
  return Boolean(
    process.env.AWS_REGION && process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID
  );
}

export function publicObjectUrl(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
