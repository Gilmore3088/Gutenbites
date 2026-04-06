import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ books: [] });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("titles")
    .select("id, gutenberg_id, title, author, feed_slug, published_at, seo_description")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ books: data ?? [] });
}
