import { downloadFromR2, uploadBufferToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";
import type { Chapter, Feed } from "@/lib/supabase";
import { chunkTextBySentence, synthesizeChunk } from "@/lib/elevenlabs";

export async function synthesizeTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error: titleError } = await supabase
    .from("titles")
    .select("*")
    .eq("id", titleId)
    .single();

  if (titleError || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("*")
    .eq("slug", title.feed_slug)
    .single();

  if (feedError || !feed) {
    throw new Error(`Feed not found for slug: ${title.feed_slug}`);
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("title_id", titleId)
    .order("chapter_num", { ascending: true });

  if (chaptersError || !chapters) {
    throw new Error(`Failed to fetch chapters for title: ${titleId}`);
  }

  const typedFeed = feed as Feed;
  let totalCharCount = 0;

  for (const chapter of chapters as Chapter[]) {
    if (!chapter.text_r2_key) {
      throw new Error(`Chapter ${chapter.chapter_num} has no text_r2_key`);
    }

    let text = await downloadFromR2(chapter.text_r2_key);

    if (title.intro_text) {
      text = `${title.intro_text}\n\n${text}`;
    }

    const chunks = chunkTextBySentence(text);
    const chunkBuffers: Buffer[] = [];
    let chapterCharCount = 0;
    const gutenbergId = title.gutenberg_id;
    const chapterNum = String(chapter.chapter_num).padStart(3, "0");

    for (let i = 0; i < chunks.length; i++) {
      const chunkIndex = String(i).padStart(3, "0");
      const { audio, charCount } = await synthesizeChunk(chunks[i], typedFeed.voice_id);

      const chunkKey = `audio/chunks/${gutenbergId}/${chapterNum}/chunk_${chunkIndex}.mp3`;
      await uploadBufferToR2(chunkKey, audio, "audio/mpeg");

      chunkBuffers.push(audio);
      chapterCharCount += charCount;
    }

    const rawAudioBuffer = Buffer.concat(chunkBuffers);
    const rawKey = `audio/raw/${gutenbergId}/${chapterNum}.mp3`;
    await uploadBufferToR2(rawKey, rawAudioBuffer, "audio/mpeg");

    await supabase
      .from("chapters")
      .update({
        audio_raw_r2_key: rawKey,
        tts_char_count: chapterCharCount,
        status: "synthesized",
      })
      .eq("id", chapter.id);

    totalCharCount += chapterCharCount;
  }

  await transitionTitle(titleId, "qa_passed", "synthesized");
  await logPipelineEvent(titleId, "synthesize_complete", "qa_passed", "synthesized", {
    total_char_count: totalCharCount,
    chapter_count: chapters.length,
  });
}
