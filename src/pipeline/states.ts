export const PIPELINE_STATES = [
  "queued", "ingested", "cleaned", "segmented", "enriched",
  "qa_passed", "synthesized", "processed", "published",
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

export function getNextState(current: string): PipelineState | null {
  const index = PIPELINE_STATES.indexOf(current as PipelineState);
  if (index === -1 || index === PIPELINE_STATES.length - 1) return null;
  return PIPELINE_STATES[index + 1];
}

export function isValidTransition(from: string, to: string): boolean {
  if (to.startsWith("error_")) return true;
  if (from.startsWith("error_")) {
    const errorTarget = from.replace("error_", "");
    const targetIndex = PIPELINE_STATES.indexOf(errorTarget as PipelineState);
    if (targetIndex > 0) return to === PIPELINE_STATES[targetIndex - 1];
  }
  const fromIndex = PIPELINE_STATES.indexOf(from as PipelineState);
  const toIndex = PIPELINE_STATES.indexOf(to as PipelineState);
  return fromIndex !== -1 && toIndex !== -1 && toIndex === fromIndex + 1;
}

export function getErrorState(stage: string): string {
  return `error_${stage}`;
}

export const STATE_TO_STAGE: Record<string, string> = {
  queued: "ingest", ingested: "clean", cleaned: "segment",
  segmented: "enrich", enriched: "qa", qa_passed: "synthesize",
  synthesized: "postprocess", processed: "publish",
};

export const RETRY_CONFIG: Record<string, { maxRetries: number; backoffMinutes: number[] }> = {
  error_ingested: { maxRetries: 5, backoffMinutes: [1, 5, 60, 360, 1440] },
  error_cleaned: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
  error_segmented: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
  error_enriched: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
  error_qa_passed: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
  error_synthesized: { maxRetries: 5, backoffMinutes: [1, 5, 60, 360, 1440] },
  error_processed: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
  error_published: { maxRetries: 3, backoffMinutes: [1, 5, 60] },
};

export function getRetryBackoffMs(errorState: string, retryCount: number): number {
  const config = RETRY_CONFIG[errorState];
  if (!config) return 60000; // default 1 minute
  const index = Math.min(retryCount, config.backoffMinutes.length - 1);
  return config.backoffMinutes[index] * 60 * 1000;
}

export function canRetry(errorState: string, retryCount: number): boolean {
  const config = RETRY_CONFIG[errorState];
  if (!config) return false;
  return retryCount < config.maxRetries;
}
