import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockDownload = vi.fn();
const mockGetPublicUrl = vi.fn().mockReturnValue({
  data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/gutenbites/test.txt" },
});

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        download: mockDownload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

import {
  uploadToR2,
  downloadFromR2,
  downloadBufferFromR2,
  getPublicUrl,
} from "@/lib/r2";

beforeEach(() => {
  vi.clearAllMocks();
  mockDownload.mockReset();
});

describe("uploadToR2 (Supabase Storage)", () => {
  it("uploads string content", async () => {
    await uploadToR2("books/test.txt", "hello world", "text/plain");
    expect(mockUpload).toHaveBeenCalledWith(
      "books/test.txt",
      expect.any(Blob),
      { contentType: "text/plain", upsert: true }
    );
  });

  it("uploads Buffer content", async () => {
    const buf = Buffer.from("binary data");
    await uploadToR2("audio/test.mp3", buf, "audio/mpeg");
    expect(mockUpload).toHaveBeenCalledWith(
      "audio/test.mp3",
      expect.any(Blob),
      { contentType: "audio/mpeg", upsert: true }
    );
  });

  it("throws on upload error after retries", async () => {
    mockUpload
      .mockResolvedValueOnce({ error: { message: "Quota exceeded" } })
      .mockResolvedValueOnce({ error: { message: "Quota exceeded" } })
      .mockResolvedValueOnce({ error: { message: "Quota exceeded" } });
    await expect(uploadToR2("key", "body", "text/plain")).rejects.toThrow("Quota exceeded");
  });
});

describe("downloadFromR2 (Supabase Storage)", () => {
  it("returns string content", async () => {
    const blob = new Blob(["book content here"], { type: "text/plain" });
    mockDownload.mockResolvedValueOnce({ data: blob, error: null });

    const result = await downloadFromR2("books/test.txt");
    expect(result).toBe("book content here");
  });

  it("throws on download error", async () => {
    mockDownload.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });
    await expect(downloadFromR2("missing-key")).rejects.toThrow("Not found");
  });
});

describe("downloadBufferFromR2 (Supabase Storage)", () => {
  it("returns a Buffer", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/mpeg" });
    mockDownload.mockResolvedValueOnce({ data: blob, error: null });

    const result = await downloadBufferFromR2("audio/test.mp3");
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("throws when download fails", async () => {
    mockDownload.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });
    await expect(downloadBufferFromR2("missing")).rejects.toThrow("Not found");
  });
});

describe("getPublicUrl", () => {
  it("returns a public URL", () => {
    const url = getPublicUrl("audio/episode-1.mp3");
    expect(url).toContain("gutenbites");
    expect(mockGetPublicUrl).toHaveBeenCalledWith("audio/episode-1.mp3");
  });
});
