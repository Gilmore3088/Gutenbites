import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/r2", () => ({
  downloadFromR2: vi.fn(),
  uploadBufferToR2: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/tts", () => ({
  chunkTextBySentence: vi.fn(),
  synthesizeChunk: vi.fn(),
}));

import { synthesizeTitle } from "../../src/pipeline/synthesize";

describe("synthesizeTitle", () => {
  it("is importable and is a function", () => {
    expect(typeof synthesizeTitle).toBe("function");
  });

  it("throws when title is not found", async () => {
    const { getSupabase } = await import("@/lib/supabase");
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    });

    await expect(synthesizeTitle("missing-id")).rejects.toThrow("Title not found");
  });
});
