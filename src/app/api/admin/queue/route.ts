import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { validateQueueInput, type QueueInput } from "./validate";

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request.headers.get("authorization"), request.cookies.get("sb-access-token")?.value);
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

  // Dev mode: simulate success when Supabase isn't configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      queued: body.gutenberg_ids.length,
      duplicates: 0,
      queued_ids: body.gutenberg_ids,
      duplicate_ids: [],
      dev_mode: true,
    });
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
