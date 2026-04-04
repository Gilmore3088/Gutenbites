import { downloadFromR2, uploadToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle } from "@/lib/supabase";
import type { Title } from "@/lib/supabase";

const START_MARKERS = [
  "*** START OF THE PROJECT GUTENBERG EBOOK",
  "*** START OF THIS PROJECT GUTENBERG EBOOK",
  "***START OF THE PROJECT GUTENBERG EBOOK",
];

const END_MARKERS = [
  "*** END OF THE PROJECT GUTENBERG EBOOK",
  "*** END OF THIS PROJECT GUTENBERG EBOOK",
  "End of the Project Gutenberg EBook",
  "End of Project Gutenberg",
];

export function stripGutenbergBoilerplate(text: string): string {
  let result = text;

  for (const marker of START_MARKERS) {
    const idx = result.indexOf(marker);
    if (idx !== -1) {
      const lineEnd = result.indexOf("\n", idx);
      result = lineEnd !== -1 ? result.slice(lineEnd + 1) : result.slice(idx + marker.length);
      break;
    }
  }

  for (const marker of END_MARKERS) {
    const idx = result.indexOf(marker);
    if (idx !== -1) {
      const lineStart = result.lastIndexOf("\n", idx);
      result = lineStart !== -1 ? result.slice(0, lineStart) : result.slice(0, idx);
      break;
    }
  }

  return result;
}

export function normalizeWhitespace(text: string): string {
  let result = text;

  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  result = result.replace(/\[Footnote:[^\]]*\]/g, "");

  result = result.replace(/\[\d+\]/g, "");

  result = result.replace(/^[ \t]*-\s*\d+\s*-[ \t]*$/gm, "");

  result = result.replace(/^[ \t]*Page\s+\d+[ \t]*$/gm, "");

  result = result.replace(/^[ \t]*\d+[ \t]*$/gm, "");

  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

export async function cleanTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error } = await supabase
    .from("titles")
    .select("*")
    .eq("id", titleId)
    .single();

  if (error || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  const rawKey = (title as Title).raw_r2_key;
  if (!rawKey) {
    throw new Error(`No raw R2 key for title: ${titleId}`);
  }

  const rawText = await downloadFromR2(rawKey);
  const stripped = stripGutenbergBoilerplate(rawText);
  const cleaned = normalizeWhitespace(stripped);

  const cleanKey = `texts/clean/${(title as Title).gutenberg_id}.txt`;
  await uploadToR2(cleanKey, cleaned, "text/plain");

  await transitionTitle(titleId, "ingested", "cleaned", {
    clean_r2_key: cleanKey,
  } as Partial<Title>);
}
