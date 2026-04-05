import { getSupabase, logPipelineEvent } from "@/lib/supabase";
import { uploadToR2 } from "@/lib/r2";
import { canRetry, getRetryBackoffMs } from "./states";
import { fetchGutenbergMetadata, fetchGutenbergText } from "./ingest";
import { cleanTitle } from "./clean";
import { segmentTitle } from "./segment";
import { enrichTitle } from "./enrich";
import { qaTitle } from "./qa";
import { synthesizeTitle } from "./synthesize";
import { postprocessTitle } from "./postprocess";
import { publishTitle } from "./publish";

const STAGE_RUNNERS: Record<string, (titleId: string) => Promise<void>> = {
  ingested: cleanTitle,
  cleaned: segmentTitle,
  segmented: enrichTitle,
  enriched: qaTitle,
  qa_passed: synthesizeTitle,
  synthesized: postprocessTitle,
  processed: publishTitle,
};

export interface OrchestratorResult {
  processed: boolean;
  titleId: string | null;
  title: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  error: string | null;
  stages: string[];
}

export interface QueuedTitle {
  id: string;
  title: string;
  status: string;
  gutenberg_id: number;
  feed_slug: string;
  retry_count: number;
  updated_at: string;
}

async function ingestQueuedTitle(titleId: string, gutenbergId: number): Promise<void> {
  const supabase = getSupabase();

  const metadata = await fetchGutenbergMetadata(gutenbergId);
  const rawText = await fetchGutenbergText(gutenbergId);

  const r2Key = `texts/raw/${gutenbergId}.txt`;
  await uploadToR2(r2Key, rawText, "text/plain");

  const { error } = await supabase
    .from("titles")
    .update({
      title: metadata.title,
      author: metadata.author,
      language: metadata.language,
      status: "ingested",
      raw_r2_key: r2Key,
    })
    .eq("id", titleId);

  if (error) {
    throw new Error(`Failed to update title after ingest: ${error.message}`);
  }

  await logPipelineEvent(titleId, "state_transition", "queued", "ingested", {
    gutenberg_id: gutenbergId,
    raw_r2_key: r2Key,
  });
}

export async function pickNextTitle(): Promise<QueuedTitle | null> {
  const supabase = getSupabase();

  const { data: queued } = await supabase
    .from("titles")
    .select("id, title, status, gutenberg_id, feed_slug, retry_count, updated_at")
    .eq("status", "queued")
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);

  if (queued && queued.length > 0) {
    return queued[0];
  }

  const { data: errored } = await supabase
    .from("titles")
    .select("id, title, status, gutenberg_id, feed_slug, retry_count, updated_at")
    .like("status", "error_%")
    .order("updated_at", { ascending: true })
    .limit(20);

  if (errored) {
    const now = Date.now();
    for (const candidate of errored) {
      if (!canRetry(candidate.status, candidate.retry_count)) continue;
      const backoffMs = getRetryBackoffMs(candidate.status, candidate.retry_count);
      const updatedAt = new Date(candidate.updated_at).getTime();
      if (now - updatedAt >= backoffMs) {
        return candidate;
      }
    }
  }

  const intermediateStates = [
    "ingested", "cleaned", "segmented", "enriched",
    "qa_passed", "synthesized", "processed",
  ];

  const { data: inProgress } = await supabase
    .from("titles")
    .select("id, title, status, gutenberg_id, feed_slug, retry_count, updated_at")
    .in("status", intermediateStates)
    .order("updated_at", { ascending: true })
    .limit(1);

  if (inProgress && inProgress.length > 0) {
    return inProgress[0];
  }

  return null;
}

export async function runPipeline(titleId: string, startStatus: string): Promise<OrchestratorResult> {
  const supabase = getSupabase();
  const stages: string[] = [];
  let currentStatus = startStatus;

  if (currentStatus.startsWith("error_")) {
    const targetState = currentStatus.replace("error_", "");
    const stageKeys = Object.keys(STAGE_RUNNERS);
    const stateIndex = stageKeys.indexOf(targetState);

    let resetStatus: string;
    if (stateIndex > 0) {
      resetStatus = stageKeys[stateIndex - 1];
    } else {
      resetStatus = "queued";
    }

    await supabase
      .from("titles")
      .update({ status: resetStatus, error_msg: null })
      .eq("id", titleId);

    await logPipelineEvent(titleId, "retry", currentStatus, resetStatus, {});
    stages.push(`retry: ${currentStatus} -> ${resetStatus}`);
    currentStatus = resetStatus;
  }

  while (currentStatus !== "published" && currentStatus !== "queued") {
    const runner = STAGE_RUNNERS[currentStatus];
    if (!runner) break;

    const stageName = currentStatus;
    try {
      await runner(titleId);

      const { data } = await supabase
        .from("titles")
        .select("status")
        .eq("id", titleId)
        .single();

      currentStatus = data?.status ?? currentStatus;
      stages.push(stageName);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorState = `error_${stageName}`;

      const { data: current } = await supabase
        .from("titles")
        .select("retry_count")
        .eq("id", titleId)
        .single();

      const newRetryCount = (current?.retry_count ?? 0) + 1;

      await supabase
        .from("titles")
        .update({ status: errorState, error_msg: errorMsg, retry_count: newRetryCount })
        .eq("id", titleId);

      await logPipelineEvent(titleId, "error", stageName, errorState, { error: errorMsg });

      return {
        processed: false,
        titleId,
        title: null,
        fromStatus: startStatus,
        toStatus: errorState,
        error: errorMsg,
        stages,
      };
    }
  }

  const { data: final } = await supabase
    .from("titles")
    .select("title, status")
    .eq("id", titleId)
    .single();

  return {
    processed: true,
    titleId,
    title: final?.title ?? null,
    fromStatus: startStatus,
    toStatus: final?.status ?? currentStatus,
    error: null,
    stages,
  };
}

export async function processNext(): Promise<OrchestratorResult> {
  const candidate = await pickNextTitle();

  if (!candidate) {
    return {
      processed: false,
      titleId: null,
      title: null,
      fromStatus: null,
      toStatus: null,
      error: "No titles to process",
      stages: [],
    };
  }

  if (candidate.status === "queued") {
    try {
      await ingestQueuedTitle(candidate.id, candidate.gutenberg_id);
      return runPipeline(candidate.id, "ingested");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const supabase = getSupabase();

      const { data: current } = await supabase
        .from("titles")
        .select("retry_count")
        .eq("id", candidate.id)
        .single();

      const newRetryCount = (current?.retry_count ?? 0) + 1;

      await supabase
        .from("titles")
        .update({ status: "error_ingested", error_msg: errorMsg, retry_count: newRetryCount })
        .eq("id", candidate.id);

      await logPipelineEvent(candidate.id, "error", "queued", "error_ingested", { error: errorMsg });

      return {
        processed: false,
        titleId: candidate.id,
        title: candidate.title,
        fromStatus: "queued",
        toStatus: "error_ingested",
        error: errorMsg,
        stages: [],
      };
    }
  }

  return runPipeline(candidate.id, candidate.status);
}
