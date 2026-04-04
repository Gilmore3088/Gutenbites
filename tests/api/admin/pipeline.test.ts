import { describe, it, expect } from "vitest";
import { buildPipelineStats } from "@/app/api/admin/pipeline/stats";

describe("buildPipelineStats", () => {
  it("counts titles by status correctly", () => {
    const titles = [
      { id: "1", title: "Book A", status: "queued", error_msg: null, updated_at: "2024-01-01" },
      { id: "2", title: "Book B", status: "ingested", error_msg: null, updated_at: "2024-01-01" },
      { id: "3", title: "Book C", status: "queued", error_msg: null, updated_at: "2024-01-01" },
      { id: "4", title: "Book D", status: "published", error_msg: null, updated_at: "2024-01-01" },
    ];

    const stats = buildPipelineStats(titles);

    expect(stats.totalTitles).toBe(4);
    expect(stats.counts["queued"]).toBe(2);
    expect(stats.counts["ingested"]).toBe(1);
    expect(stats.counts["published"]).toBe(1);
  });

  it("includes error titles list", () => {
    const titles = [
      { id: "1", title: "Book A", status: "error_ingest", error_msg: "Network timeout", updated_at: "2024-01-01" },
      { id: "2", title: "Book B", status: "queued", error_msg: null, updated_at: "2024-01-01" },
      { id: "3", title: "Book C", status: "error_clean", error_msg: "Parse error", updated_at: "2024-01-01" },
    ];

    const stats = buildPipelineStats(titles);

    expect(stats.errorCount).toBe(2);
    expect(stats.errorTitles).toHaveLength(2);
    expect(stats.errorTitles[0]).toMatchObject({ id: "1", title: "Book A", status: "error_ingest" });
    expect(stats.errorTitles[1]).toMatchObject({ id: "3", title: "Book C", status: "error_clean" });
  });

  it("handles empty array", () => {
    const stats = buildPipelineStats([]);

    expect(stats.totalTitles).toBe(0);
    expect(stats.errorCount).toBe(0);
    expect(stats.errorTitles).toHaveLength(0);
    expect(Object.keys(stats.counts)).toHaveLength(0);
  });
});
