import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  function S3Client() {
    return { send: mockSend };
  }
  function PutObjectCommand(input: Record<string, unknown>) {
    return { _type: "PutObjectCommand", ...input };
  }
  function GetObjectCommand(input: Record<string, unknown>) {
    return { _type: "GetObjectCommand", ...input };
  }
  return { S3Client, PutObjectCommand, GetObjectCommand };
});

vi.mock("../../src/lib/config", () => ({
  config: {
    r2: {
      accountId: () => "test-account-id",
      accessKeyId: () => "test-access-key",
      secretAccessKey: () => "test-secret-key",
      bucketName: () => "test-bucket",
    },
  },
}));

import { uploadToR2, downloadFromR2, downloadBufferFromR2, getPublicUrl } from "../../src/lib/r2";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadToR2", () => {
  it("sends a PutObjectCommand with correct parameters", async () => {
    mockSend.mockResolvedValueOnce({});

    await uploadToR2("books/test.txt", "hello world", "text/plain");

    expect(mockSend).toHaveBeenCalledOnce();
    const command = mockSend.mock.calls[0][0];
    expect(command.Bucket).toBe("test-bucket");
    expect(command.Key).toBe("books/test.txt");
    expect(command.Body).toBe("hello world");
    expect(command.ContentType).toBe("text/plain");
  });

  it("sends a PutObjectCommand with Buffer body", async () => {
    mockSend.mockResolvedValueOnce({});
    const buf = Buffer.from("binary data");

    await uploadToR2("audio/test.mp3", buf, "audio/mpeg");

    expect(mockSend).toHaveBeenCalledOnce();
    const command = mockSend.mock.calls[0][0];
    expect(command.Body).toBe(buf);
    expect(command.ContentType).toBe("audio/mpeg");
  });

  it("throws when S3 send rejects", async () => {
    mockSend.mockRejectedValueOnce(new Error("S3 error"));

    await expect(uploadToR2("key", "body", "text/plain")).rejects.toThrow("S3 error");
  });
});

describe("downloadFromR2", () => {
  it("returns string content from response body", async () => {
    const mockBody = {
      transformToString: vi.fn().mockResolvedValueOnce("book content here"),
    };
    mockSend.mockResolvedValueOnce({ Body: mockBody });

    const result = await downloadFromR2("books/test.txt");

    expect(result).toBe("book content here");
    expect(mockBody.transformToString).toHaveBeenCalledWith("utf-8");
  });

  it("throws when response body is empty", async () => {
    mockSend.mockResolvedValueOnce({ Body: null });

    await expect(downloadFromR2("missing-key")).rejects.toThrow(
      "Empty response for R2 key: missing-key"
    );
  });

  it("sends GetObjectCommand with correct bucket and key", async () => {
    const mockBody = {
      transformToString: vi.fn().mockResolvedValueOnce("content"),
    };
    mockSend.mockResolvedValueOnce({ Body: mockBody });

    await downloadFromR2("some/path/file.txt");

    const command = mockSend.mock.calls[0][0];
    expect(command.Bucket).toBe("test-bucket");
    expect(command.Key).toBe("some/path/file.txt");
  });
});

describe("downloadBufferFromR2", () => {
  it("returns a Buffer from response body", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const mockBody = {
      transformToByteArray: vi.fn().mockResolvedValueOnce(bytes),
    };
    mockSend.mockResolvedValueOnce({ Body: mockBody });

    const result = await downloadBufferFromR2("audio/test.mp3");

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toEqual(Buffer.from(bytes));
  });

  it("throws when response body is empty", async () => {
    mockSend.mockResolvedValueOnce({ Body: undefined });

    await expect(downloadBufferFromR2("missing-key")).rejects.toThrow(
      "Empty response for R2 key: missing-key"
    );
  });
});

describe("getPublicUrl", () => {
  it("returns the correct public URL for a key", () => {
    const url = getPublicUrl("audio/episode-1.mp3");
    expect(url).toBe("https://test-bucket.r2.dev/audio/episode-1.mp3");
  });

  it("handles keys with no path prefix", () => {
    const url = getPublicUrl("file.txt");
    expect(url).toBe("https://test-bucket.r2.dev/file.txt");
  });
});
