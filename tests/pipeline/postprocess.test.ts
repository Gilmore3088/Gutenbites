import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
  transitionTitle: vi.fn().mockResolvedValue(undefined),
  logPipelineEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/r2", () => ({
  downloadBufferFromR2: vi.fn(),
  uploadBufferToR2: vi.fn().mockResolvedValue(undefined),
  getPublicUrl: vi.fn().mockReturnValue("https://example.com/audio.mp3"),
}));

import { buildFfmpegCommand, postprocessTitle } from "../../src/pipeline/postprocess";

describe("buildFfmpegCommand", () => {
  const INPUT = "/tmp/raw.mp3";
  const OUTPUT = "/tmp/final.mp3";

  it("includes loudnorm filter", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).toContain("loudnorm");
    expect(cmd).toContain("-16");
  });

  it("includes 128k bitrate", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).toContain("128k");
  });

  it("includes 44100 sample rate", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).toContain("44100");
  });

  it("includes input and output paths", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).toContain(INPUT);
    expect(cmd).toContain(OUTPUT);
  });

  it("does not use concat filter without intro/outro", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).not.toContain("concat");
  });

  it("uses concat filter with intro music", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, {
      introMusicPath: "/tmp/intro.mp3",
      outroMusicPath: null,
    });
    expect(cmd).toContain("concat");
    expect(cmd).toContain("/tmp/intro.mp3");
  });

  it("uses concat filter with outro music", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, {
      introMusicPath: null,
      outroMusicPath: "/tmp/outro.mp3",
    });
    expect(cmd).toContain("concat");
    expect(cmd).toContain("/tmp/outro.mp3");
  });

  it("uses concat filter with both intro and outro music", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, {
      introMusicPath: "/tmp/intro.mp3",
      outroMusicPath: "/tmp/outro.mp3",
    });
    expect(cmd).toContain("concat");
    expect(cmd).toContain("/tmp/intro.mp3");
    expect(cmd).toContain("/tmp/outro.mp3");
  });

  it("uses libmp3lame codec", () => {
    const cmd = buildFfmpegCommand(INPUT, OUTPUT, { introMusicPath: null, outroMusicPath: null });
    expect(cmd).toContain("libmp3lame");
  });
});

describe("postprocessTitle", () => {
  it("is importable and is a function", () => {
    expect(typeof postprocessTitle).toBe("function");
  });
});
