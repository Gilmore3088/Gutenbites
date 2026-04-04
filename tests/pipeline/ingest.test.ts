import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2", () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

import { parseGutenbergMetadata, fetchGutenbergText } from "../../src/pipeline/ingest";

const SAMPLE_RDF = `<?xml version="1.0" encoding="utf-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:dcterms="http://purl.org/dc/terms/"
         xmlns:pgterms="http://www.gutenberg.org/2009/pgterms/">
  <pgterms:ebook rdf:about="ebooks/1342">
    <dcterms:title>Pride and Prejudice</dcterms:title>
    <dcterms:creator>
      <pgterms:agent>
        <pgterms:name>Austen, Jane</pgterms:name>
      </pgterms:agent>
    </dcterms:creator>
    <dcterms:language>
      <rdf:Description>
        <rdf:value>en</rdf:value>
      </rdf:Description>
    </dcterms:language>
    <dcterms:subject>
      <rdf:Description>
        <rdf:value>Love stories</rdf:value>
      </rdf:Description>
    </dcterms:subject>
    <dcterms:subject>
      <rdf:Description>
        <rdf:value>England -- Fiction</rdf:value>
      </rdf:Description>
    </dcterms:subject>
  </pgterms:ebook>
</rdf:RDF>`;

describe("parseGutenbergMetadata", () => {
  it("extracts title from RDF", () => {
    const meta = parseGutenbergMetadata(SAMPLE_RDF);
    expect(meta.title).toBe("Pride and Prejudice");
  });

  it("extracts author from RDF", () => {
    const meta = parseGutenbergMetadata(SAMPLE_RDF);
    expect(meta.author).toBe("Austen, Jane");
  });

  it("extracts language from RDF", () => {
    const meta = parseGutenbergMetadata(SAMPLE_RDF);
    expect(meta.language).toBe("en");
  });

  it("extracts subjects from RDF", () => {
    const meta = parseGutenbergMetadata(SAMPLE_RDF);
    expect(meta.subjects).toContain("Love stories");
    expect(meta.subjects).toContain("England -- Fiction");
  });

  it("returns empty strings and array when fields not found", () => {
    const meta = parseGutenbergMetadata("<rdf:RDF></rdf:RDF>");
    expect(meta.title).toBe("");
    expect(meta.author).toBe("");
    expect(meta.language).toBe("");
    expect(meta.subjects).toEqual([]);
  });
});

describe("fetchGutenbergText", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns text content on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("The full text of a book"),
    }));

    const text = await fetchGutenbergText(1342);
    expect(text).toBe("The full text of a book");
    expect(fetch).toHaveBeenCalledWith(
      "https://www.gutenberg.org/cache/epub/1342/pg1342.txt"
    );
  });

  it("throws on 404 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    await expect(fetchGutenbergText(9999)).rejects.toThrow("404");
  });
});
