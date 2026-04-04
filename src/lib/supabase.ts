import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabase.url(), config.supabase.serviceRoleKey());
  }
  return client;
}

export type TitleStatus =
  | "queued"
  | "ingested"
  | "cleaned"
  | "segmented"
  | "enriched"
  | "qa_passed"
  | "synthesized"
  | "processed"
  | "published"
  | `error_${string}`;

export interface Title {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  language: string;
  feed_slug: string;
  status: TitleStatus;
  priority_score: number;
  raw_r2_key: string | null;
  clean_r2_key: string | null;
  intro_text: string | null;
  cover_art_url: string | null;
  seo_description: string | null;
  error_msg: string | null;
  retry_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  title_id: string;
  chapter_num: number;
  chapter_title: string;
  word_count: number;
  text_r2_key: string | null;
  audio_raw_r2_key: string | null;
  audio_final_r2_key: string | null;
  audio_url: string | null;
  duration_secs: number | null;
  file_size_bytes: number | null;
  status: string;
  tts_char_count: number | null;
  pronunciation_hints: Array<{ word: string; phonetic: string }>;
  published_at: string | null;
  created_at: string;
}

export interface Feed {
  slug: string;
  name: string;
  description: string;
  voice_id: string;
  intro_music_r2: string | null;
  outro_music_r2: string | null;
  rss_url: string | null;
  created_at: string;
}

export async function logPipelineEvent(
  titleId: string | null,
  eventType: string,
  fromStatus: string | null,
  toStatus: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("pipeline_logs").insert({
    title_id: titleId,
    event_type: eventType,
    from_status: fromStatus,
    to_status: toStatus,
    metadata,
  });
  if (error) {
    console.error("Failed to log pipeline event:", error.message);
  }
}

export async function verifyAdmin(authHeader: string | null): Promise<{
  valid: boolean;
  userId: string | null;
  error: string | null;
}> {
  // Dev mode: skip auth when Supabase isn't configured
  if (!isSupabaseConfigured()) {
    return { valid: true, userId: "dev-admin", error: null };
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, userId: null, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { valid: false, userId: null, error: "Invalid token" };
  }

  const role = user.app_metadata?.role;
  if (role !== "admin") {
    return { valid: false, userId: user.id, error: "Not an admin" };
  }

  return { valid: true, userId: user.id, error: null };
}

export async function transitionTitle(
  titleId: string,
  fromStatus: string,
  toStatus: string,
  updates: Partial<Title> = {}
): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("titles")
    .update({ ...updates, status: toStatus })
    .eq("id", titleId)
    .eq("status", fromStatus)
    .select("id");

  if (error) {
    throw new Error(`State transition failed (${fromStatus} -> ${toStatus}): ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`State transition failed: title ${titleId} is not in state ${fromStatus}`);
  }

  await logPipelineEvent(titleId, "state_transition", fromStatus, toStatus, updates);
}
