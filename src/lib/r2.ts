import { getSupabase } from "./supabase";

const BUCKET = process.env.STORAGE_BUCKET ?? "gutenbites";

export async function uploadToR2(
  key: string,
  body: string | Buffer,
  contentType: string
): Promise<void> {
  const supabase = getSupabase();
  const blob =
    typeof body === "string" ? new Blob([body], { type: contentType }) : new Blob([body], { type: contentType });

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, blob, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed for ${key}: ${error.message}`);
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
