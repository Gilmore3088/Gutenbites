import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";

const MAX_IDS = 100;

interface QueueInput {
  gutenberg_ids: number[];
  feed_slug: string;
}

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateQueueInput(input: QueueInput): ValidationResult {
  const { gutenberg_ids, feed_slug } = input;

  if (!gutenberg_ids || gutenberg_ids.length === 0) {
    return { valid: false, error: "gutenberg_ids must be a non-empty array" };
  }

  if (gutenberg_ids.length > MAX_IDS) {
    return { valid: false, error: `gutenberg_ids cannot exceed ${MAX_IDS} entries` };
  }

  for (const id of gutenberg_ids) {
    if (!Number.isInteger(id) || id <= 0) {
      return { valid: false, error: "All gutenberg_ids must be positive integers" };
    }
  }

  if (!feed_slug || feed_slug.trim() === "") {
    return { valid: false, error: "feed_slug is required" };
  }

  return { valid: true, error: null };
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: QueueInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateQueueInput(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("slug")
    .eq("slug", body.feed_slug)
    .single();

  if (feedError || !feed) {
    return NextResponse.json({ error: `Feed '${body.feed_slug}' not found` }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("titles")
    .select("gutenberg_id")
    .in("gutenberg_id", body.gutenberg_ids);

  const existingIds = new Set((existing ?? []).map((r: { gutenberg_id: number }) => r.gutenberg_id));
  const newIds = body.gutenberg_ids.filter((id) => !existingIds.has(id));
  const duplicateIds = body.gutenberg_ids.filter((id) => existingIds.has(id));

  if (newIds.length > 0) {
    const rows = newIds.map((gutenberg_id) => ({
      gutenberg_id,
      feed_slug: body.feed_slug,
      status: "queued",
      title: `Gutenberg #${gutenberg_id}`,
      author: "Unknown",
      language: "en",
      priority_score: 0,
      retry_count: 0,
    }));

    const { error: insertError } = await supabase.from("titles").insert(rows);
    if (insertError) {
      return NextResponse.json({ error: "Failed to queue titles" }, { status: 500 });
    }
  }

  return NextResponse.json({
    queued: newIds.length,
    duplicates: duplicateIds.length,
    queued_ids: newIds,
    duplicate_ids: duplicateIds,
  });
}
