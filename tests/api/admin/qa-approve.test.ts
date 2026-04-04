import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/admin/qa/[chapterId]/approve/route";

describe("QA approve route", () => {
  it("exports POST as a function", () => {
    expect(typeof POST).toBe("function");
  });
});
