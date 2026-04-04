import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/r2", () => ({
  downloadFromR2: vi.fn(),
  uploadToR2: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

import { detectChapters } from "../../src/pipeline/segment";

const TEXT_ROMAN = `
Chapter I

It was the best of times, it was the worst of times,
it was the age of wisdom, it was the age of foolishness.

Chapter II

It was the epoch of belief, it was the epoch of incredulity,
it was the season of Light, it was the season of Darkness.

Chapter III

Some more content here.
`;

const TEXT_NUMERIC = `
CHAPTER 1

First chapter content here.
Multiple lines.

CHAPTER 2

Second chapter content here.

CHAPTER 3

Third chapter content.
`;

const TEXT_WORD = `
Chapter One

Opening content of chapter one.

Chapter Two

Content of chapter two.

Chapter Three

Content of chapter three.
`;

describe("detectChapters", () => {
  it("detects Roman numeral chapters (Chapter I format)", () => {
    const chapters = detectChapters(TEXT_ROMAN);
    expect(chapters.length).toBeGreaterThanOrEqual(3);
  });

  it("detects Arabic numeral chapters (CHAPTER 1 format)", () => {
    const chapters = detectChapters(TEXT_NUMERIC);
    expect(chapters.length).toBeGreaterThanOrEqual(3);
  });

  it("detects word numeral chapters (Chapter One format)", () => {
    const chapters = detectChapters(TEXT_WORD);
    expect(chapters.length).toBeGreaterThanOrEqual(3);
  });

  it("assigns correct chapter numbers", () => {
    const chapters = detectChapters(TEXT_ROMAN);
    expect(chapters[0].num).toBe(1);
    expect(chapters[1].num).toBe(2);
    expect(chapters[2].num).toBe(3);
  });

  it("extracts content between chapter headings", () => {
    const chapters = detectChapters(TEXT_ROMAN);
    expect(chapters[0].content).toContain("best of times");
    expect(chapters[1].content).toContain("epoch of belief");
  });

  it("includes word count for each chapter", () => {
    const chapters = detectChapters(TEXT_ROMAN);
    chapters.forEach((ch) => {
      expect(typeof ch.wordCount).toBe("number");
      expect(ch.wordCount).toBeGreaterThan(0);
    });
  });

  it("returns entire text as single chapter when no headings found", () => {
    const text = "Just some text without any chapter headings at all.";
    const chapters = detectChapters(text);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].num).toBe(1);
    expect(chapters[0].content).toContain("Just some text");
  });

  it("detects chapter with subtitle (Chapter I: The Beginning)", () => {
    const text = `
Chapter I: The Beginning

Content of the first chapter.

Chapter II: The Middle

Content of the second chapter.
`;
    const chapters = detectChapters(text);
    expect(chapters.length).toBeGreaterThanOrEqual(2);
  });
});
