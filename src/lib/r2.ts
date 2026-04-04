import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "./config";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2.accountId()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId(),
        secretAccessKey: config.r2.secretAccessKey(),
      },
    });
  }
  return client;
}

export async function uploadToR2(key: string, body: string | Buffer, contentType: string): Promise<void> {
  const r2 = getR2Client();
  await r2.send(new PutObjectCommand({ Bucket: config.r2.bucketName(), Key: key, Body: body, ContentType: contentType }));
}

export async function uploadBufferToR2(key: string, body: Buffer, contentType: string): Promise<void> {
  return uploadToR2(key, body, contentType);
}

export async function downloadFromR2(key: string): Promise<string> {
  const r2 = getR2Client();
  const response = await r2.send(new GetObjectCommand({ Bucket: config.r2.bucketName(), Key: key }));
  if (!response.Body) throw new Error(`Empty response for R2 key: ${key}`);
  return response.Body.transformToString("utf-8");
}

export async function downloadBufferFromR2(key: string): Promise<Buffer> {
  const r2 = getR2Client();
  const response = await r2.send(new GetObjectCommand({ Bucket: config.r2.bucketName(), Key: key }));
  if (!response.Body) throw new Error(`Empty response for R2 key: ${key}`);
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export function getPublicUrl(key: string): string {
  const bucket = config.r2.bucketName();
  return `https://${bucket}.r2.dev/${key}`;
}
