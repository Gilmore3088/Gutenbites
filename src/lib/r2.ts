import { getSupabase } from "./supabase";

const BUCKET = process.env.STORAGE_BUCKET ?? "gutenbites";

const MAX_UPLOAD_RETRIES = 3;
const UPLOAD_RETRY_DELAYS = [1000, 3000, 10000];

export async function uploadToR2(
  key: string,
  body: string | Buffer,
  contentType: string
): Promise<void> {
  const blobPart: BlobPart = typeof body === "string" ? body : body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const blob = new Blob([blobPart], { type: contentType });

  for (let attempt = 0; attempt < MAX_UPLOAD_RETRIES; attempt++) {
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, blob, { contentType, upsert: true });

    if (!error) return;

    if (attempt < MAX_UPLOAD_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, UPLOAD_RETRY_DELAYS[attempt]));
    } else {
      throw new Error(`Storage upload failed for ${key}: ${error.message}`);
    }
  }
}

export async function uploadBufferToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  return uploadToR2(key, body, contentType);
}

export async function downloadFromR2(key: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(key);

  if (error || !data) {
    throw new Error(`Storage download failed for ${key}: ${error?.message ?? "empty response"}`);
  }

  return data.text();
}

export async function downloadBufferFromR2(key: string): Promise<Buffer> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(key);

  if (error || !data) {
    throw new Error(`Storage download failed for ${key}: ${error?.message ?? "empty response"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function getPublicUrl(key: string): string {
  const supabase = getSupabase();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
