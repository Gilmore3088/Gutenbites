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

import { stripGutenbergBoilerplate, normalizeWhitespace } from "../../src/pipeline/clean";

describe("stripGutenbergBoilerplate", () => {
  it("removes everything before *** START OF THE PROJECT GUTENBERG EBOOK marker", () => {
    const text = [
      "Some header content",
      "Copyright notice",
      "*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***",
      "Chapter 1",
      "It is a truth universally acknowledged...",
    ].join("\n");

    const result = stripGutenbergBoilerplate(text);
    expect(result).not.toContain("Some header content");
    expect(result).not.toContain("Copyright notice");
    expect(result).toContain("Chapter 1");
  });

  it("removes everything after *** END OF THE PROJECT GUTENBERG EBOOK marker", () => {
    const text = [
      "*** START OF THE PROJECT GUTENBERG EBOOK BOOK ***",
      "Chapter 1",
      "Content here",
      "*** END OF THE PROJECT GUTENBERG EBOOK BOOK ***",
      "License text",
      "More footer stuff",
    ].join("\n");

    const result = stripGutenbergBoilerplate(text);
    expect(result).toContain("Chapter 1");
    expect(result).not.toContain("License text");
    expect(result).not.toContain("More footer stuff");
  });

  it("handles THIS variant of start marker", () => {
    const text = [
      "Header",
      "*** START OF THIS PROJECT GUTENBERG EBOOK BOOK ***",
      "Body content",
    ].join("\n");

    const result = stripGutenbergBoilerplate(text);
    expect(result).not.toContain("Header");
    expect(result).toContain("Body content");
  });

  it("handles ***START (no space) variant", () => {
    const text = [
      "Header",
      "***START OF THE PROJECT GUTENBERG EBOOK BOOK ***",
      "Body content",
    ].join("\n");

    const result = stripGutenbergBoilerplate(text);
    expect(result).not.toContain("Header");
    expect(result).toContain("Body content");
  });

  it("handles End of Project Gutenberg footer", () => {
    const text = [
      "*** START OF THE PROJECT GUTENBERG EBOOK BOOK ***",
      "Body content",
      "End of Project Gutenberg",
      "License",
    ].join("\n");

    const result = stripGutenbergBoilerplate(text);
    expect(result).toContain("Body content");
    expect(result).not.toContain("License");
  });

  it("returns original text if no markers found", () => {
    const text = "Just some text with no markers";
    const result = stripGutenbergBoilerplate(text);
    expect(result).toBe(text);
  });
});

describe("normalizeWhitespace", () => {
  it("collapses 3+ blank lines to 2 blank lines", () => {
    const text = "Para 1\n\n\n\n\nPara 2";
    const result = normalizeWhitespace(text);
    expect(result).not.toMatch(/\n{4,}/);
    expect(result).toContain("Para 1");
    expect(result).toContain("Para 2");
  });

  it("removes standalone page numbers", () => {
    const text = "Some text\n\n42\n\nMore text";
    const result = normalizeWhitespace(text);
    expect(result).not.toMatch(/^\s*42\s*$/m);
  });

  it("removes Page N style page numbers", () => {
    const text = "Some text\n\nPage 57\n\nMore text";
    const result = normalizeWhitespace(text);
    expect(result).not.toMatch(/^\s*Page 57\s*$/m);
  });

  it("removes dash-padded page numbers like - 99 -", () => {
    const text = "Some text\n\n- 99 -\n\nMore text";
    const result = normalizeWhitespace(text);
    expect(result).not.toMatch(/^\s*-\s*99\s*-\s*$/m);
  });

  it("removes footnote markers like [1]", () => {
    const text = "word[1] and more[23]";
    const result = normalizeWhitespace(text);
    expect(result).not.toContain("[1]");
    expect(result).not.toContain("[23]");
  });

  it("removes [Footnote: ...] markers", () => {
    const text = "text here\n[Footnote: This is a footnote.]\nmore text";
    const result = normalizeWhitespace(text);
    expect(result).not.toContain("[Footnote:");
  });

  it("normalizes Windows line endings to Unix", () => {
    const text = "line1\r\nline2\r\nline3";
    const result = normalizeWhitespace(text);
    expect(result).not.toContain("\r");
  });
});
