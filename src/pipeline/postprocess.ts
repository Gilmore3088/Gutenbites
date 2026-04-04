import { execSync } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { downloadBufferFromR2, uploadBufferToR2, getPublicUrl } from "@/lib/r2";
import { getSupabase, transitionTitle } from "@/lib/supabase";
import type { Chapter } from "@/lib/supabase";

const LOUDNORM_FILTER = "loudnorm=I=-16:TP=-1.5:LRA=11";
const OUTPUT_BITRATE = "128k";
const OUTPUT_SAMPLE_RATE = "44100";
const OUTPUT_CHANNELS = "2";

export interface FfmpegOptions {
  introMusicPath: string | null;
  outroMusicPath: string | null;
}

export function buildFfmpegCommand(
  inputPath: string,
  outputPath: string,
  options: FfmpegOptions
): string {
  const { introMusicPath, outroMusicPath } = options;
  const hasIntro = introMusicPath !== null;
  const hasOutro = outroMusicPath !== null;

  if (!hasIntro && !hasOutro) {
    return (
      `ffmpeg -y -i "${inputPath}" ` +
      `-af "${LOUDNORM_FILTER}" ` +
      `-codec:a libmp3lame -b:a ${OUTPUT_BITRATE} -ar ${OUTPUT_SAMPLE_RATE} -ac ${OUTPUT_CHANNELS} ` +
      `"${outputPath}"`
    );
  }

  const inputs: string[] = [];
  const filterParts: string[] = [];
  const streamLabels: string[] = [];
  let inputIndex = 0;

  if (hasIntro) {
    inputs.push(`-i "${introMusicPath}"`);
    streamLabels.push(`[${inputIndex}:a]`);
    inputIndex++;
  }

  inputs.push(`-i "${inputPath}"`);
  const mainIdx = inputIndex;
  inputIndex++;

  if (hasOutro) {
    inputs.push(`-i "${outroMusicPath}"`);
    streamLabels.push(`[${mainIdx}:a]`);
    streamLabels.push(`[${inputIndex}:a]`);
  } else {
    streamLabels.push(`[${mainIdx}:a]`);
  }

  const concatN = streamLabels.length;
  const concatFilter = `${streamLabels.join("")}concat=n=${concatN}:v=0:a=1[combined]`;
  filterParts.push(concatFilter);
  filterParts.push(`[combined]${LOUDNORM_FILTER}[out]`);

  return (
    `ffmpeg -y ${inputs.join(" ")} ` +
    `-filter_complex "${filterParts.join("; ")}" ` +
    `-map "[out]" ` +
    `-codec:a libmp3lame -b:a ${OUTPUT_BITRATE} -ar ${OUTPUT_SAMPLE_RATE} -ac ${OUTPUT_CHANNELS} ` +
    `"${outputPath}"`
  );
}

export async function postprocessTitle(titleId: string): Promise<void> {
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

  const tempDir = mkdtempSync(join(tmpdir(), "gutenbites-"));

  try {
    let introMusicPath: string | null = null;
    let outroMusicPath: string | null = null;

    if (feed.intro_music_r2) {
      const introBuffer = await downloadBufferFromR2(feed.intro_music_r2);
      introMusicPath = join(tempDir, "intro.mp3");
      writeFileSync(introMusicPath, introBuffer);
    }

    if (feed.outro_music_r2) {
      const outroBuffer = await downloadBufferFromR2(feed.outro_music_r2);
      outroMusicPath = join(tempDir, "outro.mp3");
      writeFileSync(outroMusicPath, outroBuffer);
    }

    for (const chapter of chapters as Chapter[]) {
      if (!chapter.audio_raw_r2_key) {
        throw new Error(`Chapter ${chapter.chapter_num} has no audio_raw_r2_key`);
      }

      const rawBuffer = await downloadBufferFromR2(chapter.audio_raw_r2_key);
      const chapterNum = String(chapter.chapter_num).padStart(3, "0");
      const rawPath = join(tempDir, `raw_${chapterNum}.mp3`);
      const finalPath = join(tempDir, `final_${chapterNum}.mp3`);

      writeFileSync(rawPath, rawBuffer);

      const cmd = buildFfmpegCommand(rawPath, finalPath, { introMusicPath, outroMusicPath });
      execSync(cmd, { stdio: "pipe" });

      const finalBuffer = readFileSync(finalPath);
      const stats = statSync(finalPath);

      const durationOutput = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalPath}"`,
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
      ).trim();
      const durationSecs = Math.round(parseFloat(durationOutput));

      const gutenbergId = title.gutenberg_id;
      const finalKey = `audio/final/${gutenbergId}/${chapterNum}.mp3`;
      await uploadBufferToR2(finalKey, finalBuffer, "audio/mpeg");

      const audioUrl = getPublicUrl(finalKey);

      await supabase
        .from("chapters")
        .update({
          audio_final_r2_key: finalKey,
          audio_url: audioUrl,
          duration_secs: durationSecs,
          file_size_bytes: stats.size,
          status: "processed",
        })
        .eq("id", chapter.id);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  await transitionTitle(titleId, "synthesized", "processed");
}
