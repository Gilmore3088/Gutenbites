import { PIPELINE_STATES } from "@/pipeline/states";

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateStatusOverride(status: string): ValidationResult {
  if (!status) {
    return { valid: false, error: "status is required" };
  }

  if (status.startsWith("error_")) {
    return { valid: true, error: null };
  }

  if ((PIPELINE_STATES as readonly string[]).includes(status)) {
    return { valid: true, error: null };
  }

  return {
    valid: false,
    error: `Unknown status '${status}'. Must be a valid pipeline state or error_<state>`,
  };
}
