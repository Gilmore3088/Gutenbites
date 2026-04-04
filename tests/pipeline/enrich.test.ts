import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/claude", () => ({
  askClaude: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

import { generateIntroPrompt, validateIntro } from "../../src/pipeline/enrich";

describe("generateIntroPrompt", () => {
  it("includes the title in the prompt", () => {
    const prompt = generateIntroPrompt("Pride and Prejudice", "Jane Austen");
    expect(prompt).toContain("Pride and Prejudice");
  });

  it("includes the author in the prompt", () => {
    const prompt = generateIntroPrompt("Pride and Prejudice", "Jane Austen");
    expect(prompt).toContain("Jane Austen");
  });

  it("requests 150-250 word intro", () => {
    const prompt = generateIntroPrompt("Moby Dick", "Herman Melville");
    expect(prompt).toMatch(/150[-–]250|150 to 250/);
  });

  it("mentions podcast context", () => {
    const prompt = generateIntroPrompt("Dracula", "Bram Stoker");
    expect(prompt.toLowerCase()).toContain("podcast");
  });
});

describe("validateIntro", () => {
  it("accepts text with exactly 150 words", () => {
    const words = Array(150).fill("word").join(" ");
    expect(validateIntro(words)).toBe(true);
  });

  it("accepts text with exactly 250 words", () => {
    const words = Array(250).fill("word").join(" ");
    expect(validateIntro(words)).toBe(true);
  });

  it("accepts text with 200 words", () => {
    const words = Array(200).fill("word").join(" ");
    expect(validateIntro(words)).toBe(true);
  });

  it("rejects text with fewer than 150 words", () => {
    const words = Array(100).fill("word").join(" ");
    expect(validateIntro(words)).toBe(false);
  });

  it("rejects text with more than 250 words", () => {
    const words = Array(300).fill("word").join(" ");
    expect(validateIntro(words)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateIntro("")).toBe(false);
  });
});
