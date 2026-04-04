import { describe, it, expect } from "vitest";
import { validateQueueInput } from "@/app/api/admin/queue/validate";

describe("validateQueueInput", () => {
  it("accepts valid input", () => {
    const result = validateQueueInput({ gutenberg_ids: [1, 2, 3], feed_slug: "classics" });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it("rejects empty gutenberg_ids", () => {
    const result = validateQueueInput({ gutenberg_ids: [], feed_slug: "classics" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/gutenberg_ids/i);
  });

  it("rejects missing feed_slug", () => {
    const result = validateQueueInput({ gutenberg_ids: [1], feed_slug: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/feed_slug/i);
  });

  it("rejects non-integer IDs", () => {
    const result = validateQueueInput({ gutenberg_ids: [1, 1.5, 3], feed_slug: "classics" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/integer/i);
  });

  it("rejects > 100 IDs", () => {
    const ids = Array.from({ length: 101 }, (_, i) => i + 1);
    const result = validateQueueInput({ gutenberg_ids: ids, feed_slug: "classics" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/100/);
  });
});
