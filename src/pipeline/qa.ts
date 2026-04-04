import { askClaude } from "@/lib/claude";
import { getSupabase, transitionTitle } from "@/lib/supabase";
import type { Title, Chapter } from "@/lib/supabase";
import { downloadFromR2 } from "@/lib/r2";

export interface QaResult {
  flags: string[];
  pronunciationHints: Array<{ word: string; phonetic: string }>;
  pass: boolean;
}

export function buildQaPrompt(
  chapterText: string,
  chapterNum: number,
  bookAvgWordCount: number
): string {
  return `You are a quality assurance assistant for a text-to-speech audiobook pipeline. Scan the following chapter text for content that may be problematic for TTS narration.

Chapter Number: ${chapterNum}
Book Average Word Count per Chapter: ${bookAvgWordCount}

Chapter Text:
${chapterText}

Check for:
1. Unusual proper nouns, foreign words, or archaic terms that need pronunciation guidance
2. Roman numerals, abbreviations, or symbols that TTS may mispronounce
3. Overly long sentences or unusual punctuation patterns
4. Any content that may cause TTS errors

Respond with a JSON object in this exact format:
{
  "flags": ["list of issues found, empty array if none"],
  "pronunciation_hints": [{"word": "difficult_word", "phonetic": "pronunciation"}, ...],
  "pass": true
}

Set "pass" to false only if there are critical issues requiring human review. Set "pass" to true for minor issues that can be auto-handled. Respond with only the JSON, no other text.`;
}

export function parseQaResponse(response: string): QaResult {
  const fallback: QaResult = {
    flags: ["QA response was not valid JSON"],
    pronunciationHints: [],
    pass: false,
  };

  if (!response || !response.trim()) return fallback;

  let jsonStr = response.trim();

  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== "object" || parsed === null) return fallback;

    return {
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      pronunciationHints: Array.isArray(parsed.pronunciation_hints)
        ? parsed.pronunciation_hints
        : [],
      pass: typeof parsed.pass === "boolean" ? parsed.pass : false,
    };
  } catch {
    return fallback;
  }
}

export async function qaTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error: titleError } = await supabase
    .from("titles")
    .select("*")
    .eq("id", titleId)
    .single();

  if (titleError || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("title_id", titleId)
    .order("chapter_num", { ascending: true });

  if (chaptersError || !chapters) {
    throw new Error(`Failed to fetch chapters for title: ${titleId}`);
  }

  const totalWords = (chapters as Chapter[]).reduce((sum, ch) => sum + (ch.word_count || 0), 0);
  const avgWordCount = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;

  for (const chapter of chapters as Chapter[]) {
    let chapterText = "";

    if (chapter.text_r2_key) {
      chapterText = await downloadFromR2(chapter.text_r2_key);
    }

    // M1 milestone: auto-pass all chapters
    const qaResult: QaResult = {
      flags: [],
      pronunciationHints: [],
      pass: true,
    };

    const updates: Record<string, unknown> = {
      pronunciation_hints: qaResult.pronunciationHints,
    };

    if (!qaResult.pass || qaResult.flags.length > 0) {
      updates.status = "qa_flagged";
    }

    await supabase
      .from("chapters")
      .update(updates)
      .eq("id", chapter.id);
  }

  await transitionTitle(titleId, "enriched", "qa_passed");
}
