import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth } from "@/lib/guards";
import { s3Client, S3_BUCKET, isS3Configured, publicObjectUrl } from "@/lib/s3";

const ALLOWED_FOLDERS = ["dogs", "walks", "walkers"] as const;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const { error } = requireAuth();
  if (error) return error;

  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "File storage isn't configured yet. Add AWS S3 credentials to .env." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { folder, fileType } = body as { folder?: string; fileType?: string };

  if (!folder || !ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number])) {
    return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
  }
  if (!fileType || !ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WEBP images are allowed" },
      { status: 400 }
    );
  }

  const extension = fileType.split("/")[1];
  const key = `${folder}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return NextResponse.json({
    uploadUrl,
    objectUrl: publicObjectUrl(key),
  });
}
