import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Feed, Title, Chapter } from "@/lib/supabase";
import { generateRssXml } from "@/rss/generate";

const CACHE_MAX_AGE_SECONDS = 900; // 15 minutes

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("*")
    .eq("slug", slug)
    .single();

  if (feedError || !feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  const { data: titles, error: titlesError } = await supabase
    .from("titles")
    .select("*")
    .eq("feed_slug", slug)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (titlesError || !titles) {
    return NextResponse.json({ error: "Failed to fetch titles" }, { status: 500 });
  }

  const titlesWithChapters: Array<{ title: Title; chapters: Chapter[] }> = [];

  for (const title of titles as Title[]) {
    const { data: chapters, error: chaptersError } = await supabase
      .from("chapters")
      .select("*")
      .eq("title_id", title.id)
      .eq("status", "published")
      .order("chapter_num", { ascending: true });

    if (!chaptersError && chapters) {
      titlesWithChapters.push({ title, chapters: chapters as Chapter[] });
    }
  }

  const xml = generateRssXml(feed as Feed, titlesWithChapters);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_MAX_AGE_SECONDS}`,
    },
  });
}
