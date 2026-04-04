import { describe, it, expect } from "vitest";
import { generateRssXml } from "../../src/rss/generate";
import type { Feed, Title, Chapter } from "../../src/lib/supabase";

const mockFeed: Feed = {
  slug: "classics",
  name: "GütenBites Classics",
  description: "The greatest works of classic literature, narrated by AI.",
  voice_id: "voice-123",
  intro_music_r2: null,
  outro_music_r2: null,
  rss_url: "https://gutenbites.com/api/rss/classics",
  created_at: "2024-01-01T00:00:00Z",
};

const mockTitle: Title = {
  id: "title-abc",
  gutenberg_id: 1342,
  title: "Pride and Prejudice",
  author: "Austen, Jane",
  language: "en",
  feed_slug: "classics",
  status: "published",
  priority_score: 0,
  raw_r2_key: "texts/raw/1342.txt",
  clean_r2_key: "texts/clean/1342.txt",
  intro_text: null,
  cover_art_url: null,
  seo_description: null,
  error_msg: null,
  retry_count: 0,
  published_at: "2024-03-01T12:00:00Z",
  created_at: "2024-02-01T00:00:00Z",
  updated_at: "2024-03-01T12:00:00Z",
};

const mockChapter: Chapter = {
  id: "chapter-xyz",
  title_id: "title-abc",
  chapter_num: 1,
  chapter_title: "Chapter I",
  word_count: 1200,
  text_r2_key: "texts/chapters/1342/001.txt",
  audio_raw_r2_key: "audio/raw/1342/001.mp3",
  audio_final_r2_key: "audio/final/1342/001.mp3",
  audio_url: "https://mybucket.r2.dev/audio/final/1342/001.mp3",
  duration_secs: 360,
  file_size_bytes: 5500000,
  status: "published",
  tts_char_count: 6000,
  pronunciation_hints: [],
  published_at: "2024-03-01T12:00:00Z",
  created_at: "2024-02-15T00:00:00Z",
};

describe("generateRssXml", () => {
  it("includes valid XML declaration", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("includes iTunes namespace", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain("xmlns:itunes");
  });

  it("includes channel title", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain("GütenBites Classics");
  });

  it("includes episode title combining book title and chapter title", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain("Pride and Prejudice");
    expect(xml).toContain("Chapter I");
  });

  it("includes enclosure with audio_url and file_size_bytes", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain('type="audio/mpeg"');
    expect(xml).toContain("5500000");
    expect(xml).toContain("https://mybucket.r2.dev/audio/final/1342/001.mp3");
  });

  it("includes itunes:duration", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain("<itunes:duration>360</itunes:duration>");
  });

  it("includes guid with isPermaLink=false", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [mockChapter] }]);
    expect(xml).toContain('isPermaLink="false"');
    expect(xml).toContain("chapter-xyz");
  });

  it("escapes XML entities in title", () => {
    const titleWithEntities: Title = {
      ...mockTitle,
      title: "Tom & Huck's <Adventure>",
    };
    const xml = generateRssXml(mockFeed, [{ title: titleWithEntities, chapters: [mockChapter] }]);
    expect(xml).toContain("Tom &amp; Huck&apos;s &lt;Adventure&gt;");
  });

  it("returns empty items when chapter has no audio_url", () => {
    const chapterNoAudio: Chapter = { ...mockChapter, audio_url: null };
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: [chapterNoAudio] }]);
    expect(xml).not.toContain("<item>");
  });

  it("returns empty channel with no titles", () => {
    const xml = generateRssXml(mockFeed, []);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
