import { describe, it, expect } from "vitest";
import { validateStatusOverride } from "@/app/api/admin/titles/[id]/status/validate";

describe("validateStatusOverride", () => {
  it("accepts valid pipeline states", () => {
    const validStates = ["queued", "ingested", "cleaned", "segmented", "enriched", "qa_passed", "synthesized", "processed", "published"];
    for (const state of validStates) {
      const result = validateStatusOverride(state);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    }
  });

  it("accepts error states", () => {
    const errorStates = ["error_ingest", "error_clean", "error_segment", "error_anything"];
    for (const state of errorStates) {
      const result = validateStatusOverride(state);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    }
  });

  it("rejects empty string", () => {
    const result = validateStatusOverride("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects unknown status", () => {
    const result = validateStatusOverride("flying");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
