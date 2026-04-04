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
