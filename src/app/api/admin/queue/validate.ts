export const MAX_IDS = 100;

export interface QueueInput {
  gutenberg_ids: number[];
  feed_slug: string;
}

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateQueueInput(input: QueueInput): ValidationResult {
  const { gutenberg_ids, feed_slug } = input;

  if (!gutenberg_ids || gutenberg_ids.length === 0) {
    return { valid: false, error: "gutenberg_ids must be a non-empty array" };
  }

  if (gutenberg_ids.length > MAX_IDS) {
    return { valid: false, error: `gutenberg_ids cannot exceed ${MAX_IDS} entries` };
  }

  for (const id of gutenberg_ids) {
    if (!Number.isInteger(id) || id <= 0) {
      return { valid: false, error: "All gutenberg_ids must be positive integers" };
    }
  }

  if (!feed_slug || feed_slug.trim() === "") {
    return { valid: false, error: "feed_slug is required" };
  }

  return { valid: true, error: null };
}
