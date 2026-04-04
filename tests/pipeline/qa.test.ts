import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/claude", () => ({
  askClaude: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

import { buildQaPrompt, parseQaResponse } from "../../src/pipeline/qa";

describe("buildQaPrompt", () => {
  it("includes the chapter text", () => {
    const prompt = buildQaPrompt("Once upon a time there was a king.", 1, 2000);
    expect(prompt).toContain("Once upon a time there was a king.");
  });

  it("includes the chapter number", () => {
    const prompt = buildQaPrompt("Some chapter content", 5, 2000);
    expect(prompt).toContain("5");
  });

  it("includes the book average word count", () => {
    const prompt = buildQaPrompt("Some chapter content", 1, 3500);
    expect(prompt).toContain("3500");
  });

  it("asks for JSON output", () => {
    const prompt = buildQaPrompt("Some text", 1, 2000);
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("asks for flags and pronunciation hints", () => {
    const prompt = buildQaPrompt("Some text", 1, 2000);
    expect(prompt.toLowerCase()).toContain("flags");
    expect(prompt.toLowerCase()).toContain("pronunciation");
  });
});

describe("parseQaResponse", () => {
  it("parses valid JSON with flags and pronunciation hints", () => {
    const response = JSON.stringify({
      flags: ["Contains Roman numerals"],
      pronunciation_hints: [{ word: "Cholmondeley", phonetic: "CHUM-lee" }],
      pass: true,
    });

    const result = parseQaResponse(response);
    expect(result.flags).toEqual(["Contains Roman numerals"]);
    expect(result.pronunciationHints).toEqual([
      { word: "Cholmondeley", phonetic: "CHUM-lee" },
    ]);
    expect(result.pass).toBe(true);
  });

  it("parses valid JSON with no flags (clean pass)", () => {
    const response = JSON.stringify({
      flags: [],
      pronunciation_hints: [],
      pass: true,
    });

    const result = parseQaResponse(response);
    expect(result.flags).toEqual([]);
    expect(result.pronunciationHints).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it("parses JSON wrapped in markdown code blocks", () => {
    const response = "```json\n" + JSON.stringify({
      flags: [],
      pronunciation_hints: [],
      pass: true,
    }) + "\n```";

    const result = parseQaResponse(response);
    expect(result.pass).toBe(true);
    expect(result.flags).toEqual([]);
  });

  it("returns failure result for malformed JSON", () => {
    const result = parseQaResponse("not valid json at all");
    expect(result.pass).toBe(false);
    expect(result.flags).toEqual(["QA response was not valid JSON"]);
    expect(result.pronunciationHints).toEqual([]);
  });

  it("returns failure result for empty response", () => {
    const result = parseQaResponse("");
    expect(result.pass).toBe(false);
    expect(result.flags).toContain("QA response was not valid JSON");
  });
});
