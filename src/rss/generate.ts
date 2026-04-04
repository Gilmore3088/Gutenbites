import type { Feed, Title, Chapter } from "@/lib/supabase";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc2822(dateStr: string): string {
  return new Date(dateStr).toUTCString();
}

export function generateRssXml(
  feed: Feed,
  titlesWithChapters: Array<{ title: Title; chapters: Chapter[] }>
): string {
  const items: string[] = [];

  for (const { title, chapters } of titlesWithChapters) {
    const publishedChapters = chapters.filter(
      (ch) => ch.audio_url && ch.file_size_bytes && ch.duration_secs
    );

    for (const chapter of publishedChapters) {
      const episodeTitle = escapeXml(`${title.title} — ${chapter.chapter_title}`);
      const pubDate = chapter.published_at
        ? toRfc2822(chapter.published_at)
        : toRfc2822(chapter.created_at);

      items.push(`    <item>
      <title>${episodeTitle}</title>
      <enclosure url="${escapeXml(chapter.audio_url!)}" length="${chapter.file_size_bytes}" type="audio/mpeg"/>
      <guid isPermaLink="false">${chapter.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <itunes:duration>${chapter.duration_secs}</itunes:duration>
      <itunes:episode>${chapter.chapter_num}</itunes:episode>
      <itunes:season>${title.gutenberg_id}</itunes:season>
      <itunes:title>${episodeTitle}</itunes:title>
      <itunes:author>${escapeXml(title.author)}</itunes:author>
    </item>`);
    }
  }

  const lastBuildDate = new Date().toUTCString();
  const channelImage = titlesWithChapters[0]?.title.cover_art_url ?? "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(feed.name)}</title>
    <link>${feed.rss_url ? escapeXml(feed.rss_url) : ""}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <itunes:author>${escapeXml(feed.name)}</itunes:author>
    <itunes:category text="Arts">
      <itunes:category text="Books"/>
    </itunes:category>
    ${channelImage ? `<itunes:image href="${escapeXml(channelImage)}"/>` : ""}
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <podcast:locked>yes</podcast:locked>
${items.join("\n")}
  </channel>
</rss>`;
}
