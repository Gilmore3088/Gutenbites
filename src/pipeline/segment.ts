import { downloadFromR2, uploadToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle } from "@/lib/supabase";
import type { Title } from "@/lib/supabase";

export interface DetectedChapter {
  num: number;
  title: string;
  content: string;
  wordCount: number;
}

const WORD_NUMERALS = [
  "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen", "Twenty", "Twenty-One", "Twenty-Two", "Twenty-Three",
  "Twenty-Four", "Twenty-Five", "Twenty-Six", "Twenty-Seven", "Twenty-Eight",
  "Twenty-Nine", "Thirty", "Thirty-One", "Thirty-Two", "Thirty-Three",
  "Thirty-Four", "Thirty-Five", "Thirty-Six", "Thirty-Seven", "Thirty-Eight",
  "Thirty-Nine", "Forty", "Forty-One", "Forty-Two", "Forty-Three", "Forty-Four",
  "Forty-Five", "Forty-Six", "Forty-Seven", "Forty-Eight", "Forty-Nine", "Fifty",
];

function buildChapterRegex(): RegExp {
  return new RegExp(
    `^(?:CHAPTER|Chapter)\\s+(?:[IVXLCDM]+|\\d+|${WORD_NUMERALS.join("|")})(?:\\s*[.:—\\u2013\\u2014-]\\s*.*)?$`,
    "gm"
  );
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function detectChapters(text: string): DetectedChapter[] {
  const regex = buildChapterRegex();
  const matches: Array<{ index: number; heading: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ index: match.index, heading: match[0] });
  }

  if (matches.length === 0) {
    return [
      {
        num: 1,
        title: "",
        content: text.trim(),
        wordCount: countWords(text),
      },
    ];
  }

  const chapters: DetectedChapter[] = [];

  for (let i = 0; i < matches.length; i++) {
    const { index, heading } = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;

    const afterHeading = text.indexOf("\n", index);
    const contentStart = afterHeading !== -1 ? afterHeading + 1 : index + heading.length;
    const content = text.slice(contentStart, nextIndex).trim();

    chapters.push({
      num: i + 1,
      title: heading.trim(),
      content,
      wordCount: countWords(content),
    });
  }

  return chapters;
}

export async function segmentTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error } = await supabase
    .from("titles")
    .select("*")
    .eq("id", titleId)
    .single();

  if (error || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  const t = title as Title;
  const cleanKey = t.clean_r2_key;
  if (!cleanKey) {
    throw new Error(`No clean R2 key for title: ${titleId}`);
  }

  const cleanText = await downloadFromR2(cleanKey);
  const chapters = detectChapters(cleanText);

  await Promise.all(
    chapters.map(async (chapter) => {
      const chapterKey = `texts/chapters/${t.gutenberg_id}/${String(chapter.num).padStart(3, "0")}.txt`;
      await uploadToR2(chapterKey, chapter.content, "text/plain");

      await supabase.from("chapters").insert({
        title_id: titleId,
        chapter_num: chapter.num,
        chapter_title: chapter.title,
        word_count: chapter.wordCount,
        text_r2_key: chapterKey,
        status: "pending",
        pronunciation_hints: [],
      });
    })
  );

  await transitionTitle(titleId, "cleaned", "segmented");
}
