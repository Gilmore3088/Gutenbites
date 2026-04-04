import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";
import type { Chapter } from "@/lib/supabase";

export async function publishTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("title_id", titleId)
    .eq("status", "processed");

  if (chaptersError) {
    throw new Error(`Failed to fetch chapters for title: ${titleId}: ${chaptersError.message}`);
  }

  if (!chapters || chapters.length === 0) {
    throw new Error(`No processed chapters found for title: ${titleId}`);
  }

  const now = new Date().toISOString();

  for (const chapter of chapters as Chapter[]) {
    const { error } = await supabase
      .from("chapters")
      .update({ status: "published", published_at: now })
      .eq("id", chapter.id);

    if (error) {
      throw new Error(`Failed to publish chapter ${chapter.chapter_num}: ${error.message}`);
    }
  }

  await transitionTitle(titleId, "processed", "published", {
    published_at: now,
  } as never);

  await logPipelineEvent(titleId, "publish_complete", "processed", "published", {
    chapter_count: chapters.length,
    published_at: now,
  });
}
