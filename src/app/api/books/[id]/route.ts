import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = getSupabase();

  const isNumeric = /^\d+$/.test(id);
  const { data: title, error } = isNumeric
    ? await supabase
        .from("titles")
        .select("*")
        .eq("gutenberg_id", parseInt(id))
        .eq("status", "published")
        .single()
    : await supabase
        .from("titles")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

  if (error || !title) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select(
      "id, chapter_num, chapter_title, word_count, audio_url, duration_secs, published_at"
    )
    .eq("title_id", title.id)
    .eq("status", "published")
    .order("chapter_num");

  const { data: feed } = await supabase
    .from("feeds")
    .select("name, slug")
    .eq("slug", title.feed_slug)
    .single();

  return NextResponse.json({
    book: {
      ...title,
      feed_name: feed?.name ?? title.feed_slug,
    },
    chapters: chapters ?? [],
  });
}
