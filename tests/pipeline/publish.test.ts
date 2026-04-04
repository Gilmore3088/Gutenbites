import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

import { publishTitle } from "../../src/pipeline/publish";

describe("publishTitle", () => {
  it("is importable and is a function", () => {
    expect(typeof publishTitle).toBe("function");
  });

  it("throws when no processed chapters found", async () => {
    const { getSupabase } = await import("@/lib/supabase");

    const chainable = {
      select: vi.fn(),
      eq: vi.fn(),
    };
    chainable.select.mockReturnValue(chainable);
    chainable.eq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ data: [], error: null });

    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(chainable),
    });

    await expect(publishTitle("title-id")).rejects.toThrow(
      "No processed chapters found"
    );
  });
});
