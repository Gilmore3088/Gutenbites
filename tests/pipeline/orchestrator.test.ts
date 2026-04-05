import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/r2", () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/pipeline/ingest", () => ({
  fetchGutenbergMetadata: vi.fn(),
  fetchGutenbergText: vi.fn(),
  ingestTitle: vi.fn(),
}));

vi.mock("@/pipeline/clean", () => ({ cleanTitle: vi.fn() }));
vi.mock("@/pipeline/segment", () => ({ segmentTitle: vi.fn() }));
vi.mock("@/pipeline/enrich", () => ({ enrichTitle: vi.fn() }));
vi.mock("@/pipeline/qa", () => ({ qaTitle: vi.fn() }));
vi.mock("@/pipeline/synthesize", () => ({ synthesizeTitle: vi.fn() }));
vi.mock("@/pipeline/postprocess", () => ({ postprocessTitle: vi.fn() }));
vi.mock("@/pipeline/publish", () => ({ publishTitle: vi.fn() }));

import { canRetry, getRetryBackoffMs } from "../../src/pipeline/states";
import { pickNextTitle, processNext, runPipeline } from "../../src/pipeline/orchestrator";

describe("canRetry", () => {
  it("returns true when retry count is below maxRetries", () => {
    expect(canRetry("error_ingested", 0)).toBe(true);
    expect(canRetry("error_ingested", 4)).toBe(true);
  });

  it("returns false when retry count equals maxRetries", () => {
    expect(canRetry("error_ingested", 5)).toBe(false);
  });

  it("returns false when retry count exceeds maxRetries", () => {
    expect(canRetry("error_ingested", 10)).toBe(false);
  });

  it("returns false for unknown error states", () => {
    expect(canRetry("error_unknown_state", 0)).toBe(false);
  });

  it("respects lower maxRetries for non-synthesis stages", () => {
    expect(canRetry("error_cleaned", 2)).toBe(true);
    expect(canRetry("error_cleaned", 3)).toBe(false);
  });
});

describe("getRetryBackoffMs", () => {
  it("returns 1 minute for first retry of error_ingested", () => {
    expect(getRetryBackoffMs("error_ingested", 0)).toBe(1 * 60 * 1000);
  });

  it("returns 5 minutes for second retry of error_ingested", () => {
    expect(getRetryBackoffMs("error_ingested", 1)).toBe(5 * 60 * 1000);
  });

  it("returns 60 minutes for third retry of error_ingested", () => {
    expect(getRetryBackoffMs("error_ingested", 2)).toBe(60 * 60 * 1000);
  });

  it("returns 1440 minutes for retry at max index of error_ingested", () => {
    expect(getRetryBackoffMs("error_ingested", 4)).toBe(1440 * 60 * 1000);
  });

  it("clamps to last backoff entry when retry count exceeds array length", () => {
    expect(getRetryBackoffMs("error_ingested", 100)).toBe(1440 * 60 * 1000);
  });

  it("returns 1 minute default for unknown error state", () => {
    expect(getRetryBackoffMs("error_unknown", 0)).toBe(60 * 1000);
  });

  it("returns correct backoffs for error_cleaned (3-step schedule)", () => {
    expect(getRetryBackoffMs("error_cleaned", 0)).toBe(1 * 60 * 1000);
    expect(getRetryBackoffMs("error_cleaned", 1)).toBe(5 * 60 * 1000);
    expect(getRetryBackoffMs("error_cleaned", 2)).toBe(60 * 60 * 1000);
  });
});

describe("pickNextTitle", () => {
  it("is an exported async function", () => {
    expect(typeof pickNextTitle).toBe("function");
    expect(pickNextTitle.constructor.name).toBe("AsyncFunction");
  });

  it("returns null when no titles are available", async () => {
    const { getSupabase } = await import("@/lib/supabase");

    const makeChain = (result: unknown) => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.like = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockResolvedValue(result);
      return chain;
    };

    const emptyResult = { data: [], error: null };
    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(makeChain(emptyResult)),
    });

    const result = await pickNextTitle();
    expect(result).toBeNull();
  });
});

describe("processNext", () => {
  it("is an exported async function", () => {
    expect(typeof processNext).toBe("function");
    expect(processNext.constructor.name).toBe("AsyncFunction");
  });

  it("returns no-op result when no titles are available", async () => {
    const { getSupabase } = await import("@/lib/supabase");

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.like = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockResolvedValue({ data: [], error: null });

    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    const result = await processNext();
    expect(result.processed).toBe(false);
    expect(result.titleId).toBeNull();
    expect(result.error).toBe("No titles to process");
  });
});

describe("runPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is an exported async function", () => {
    expect(typeof runPipeline).toBe("function");
    expect(runPipeline.constructor.name).toBe("AsyncFunction");
  });

  it("returns a result with processed true when all stages succeed", async () => {
    const { getSupabase } = await import("@/lib/supabase");
    const { cleanTitle } = await import("@/pipeline/clean");
    const { segmentTitle } = await import("@/pipeline/segment");
    const { enrichTitle } = await import("@/pipeline/enrich");
    const { qaTitle } = await import("@/pipeline/qa");
    const { synthesizeTitle } = await import("@/pipeline/synthesize");
    const { postprocessTitle } = await import("@/pipeline/postprocess");
    const { publishTitle } = await import("@/pipeline/publish");

    const statuses = [
      { status: "cleaned" },
      { status: "segmented" },
      { status: "enriched" },
      { status: "qa_passed" },
      { status: "synthesized" },
      { status: "processed" },
      { status: "published" },
      { title: "Test Book", status: "published" },
    ];

    let callCount = 0;
    const singleMock = vi.fn().mockImplementation(() => {
      const entry = statuses[callCount] ?? statuses[statuses.length - 1];
      callCount++;
      return Promise.resolve({ data: entry, error: null });
    });

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.single = singleMock;

    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    (cleanTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (segmentTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (enrichTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (qaTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (synthesizeTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (postprocessTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (publishTitle as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await runPipeline("title-123", "ingested");

    expect(result.processed).toBe(true);
    expect(result.titleId).toBe("title-123");
    expect(result.fromStatus).toBe("ingested");
    expect(result.error).toBeNull();
  });

  it("returns processed false with error info when a stage throws", async () => {
    const { getSupabase } = await import("@/lib/supabase");
    const { cleanTitle } = await import("@/pipeline/clean");

    (cleanTitle as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Clean stage failed"));

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: { retry_count: 0 }, error: null });

    (getSupabase as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    });

    const result = await runPipeline("title-456", "ingested");

    expect(result.processed).toBe(false);
    expect(result.error).toBe("Clean stage failed");
    expect(result.toStatus).toBe("error_ingested");
    expect(result.fromStatus).toBe("ingested");
  });
});
