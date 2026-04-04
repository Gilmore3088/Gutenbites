import { askClaude } from "@/lib/claude";
import { getSupabase, transitionTitle } from "@/lib/supabase";
import type { Title } from "@/lib/supabase";

const SONNET_MODEL = "claude-sonnet-4-5";
const MIN_WORDS = 150;
const MAX_WORDS = 250;

export function generateIntroPrompt(title: string, author: string): string {
  return `You are writing editorial content for a classic literature podcast. Write a compelling 150-250 word podcast introduction for the following book:

Title: ${title}
Author: ${author}

The introduction should:
- Hook the listener with why this book matters
- Give brief context about the author and work
- Hint at themes without spoilers
- Feel warm and inviting for a podcast audience
- Be written in second person or direct address

Write only the introduction text, no headings or labels. The introduction must be between 150 and 250 words.`;
}

export function validateIntro(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const wordCount = trimmed.split(/\s+/).length;
  return wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
}

export async function enrichTitle(titleId: string): Promise<void> {
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
  const prompt = generateIntroPrompt(t.title, t.author);

  let intro = "";
  const firstResponse = await askClaude(prompt, { model: SONNET_MODEL, maxTokens: 512 });
  intro = firstResponse.text.trim();

  if (!validateIntro(intro)) {
    const retryResponse = await askClaude(
      prompt + "\n\nIMPORTANT: Your response must be between 150 and 250 words. Count carefully.",
      { model: SONNET_MODEL, maxTokens: 512 }
    );
    intro = retryResponse.text.trim();
  }

  await transitionTitle(titleId, "segmented", "enriched", {
    intro_text: intro,
  } as Partial<Title>);
}
