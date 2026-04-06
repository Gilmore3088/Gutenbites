import { execSync } from "child_process";
import { readFileSync, unlinkSync, mkdtempSync } from "fs";
import path from "path";
import os from "os";
import { config } from "./config";

const BASE_URL = "https://api.elevenlabs.io/v1";
const MAX_CHUNK_CHARS = 2400;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 30000];
const USE_MOCK_TTS = process.env.MOCK_TTS === "true";

export function chunkTextBySentence(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > MAX_CHUNK_CHARS && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockAudio(text: string): Buffer {
  // Generate a short silent MP3 — fixed 3 seconds to keep files small
  const durationSecs = 3;
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "mock-tts-"));
  const outPath = path.join(tmpDir, "mock.mp3");

  try {
    execSync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSecs} -codec:a libmp3lame -b:a 128k "${outPath}"`,
      { stdio: "pipe" }
    );
    return readFileSync(outPath);
  } finally {
    try { unlinkSync(outPath); } catch {}
    try { require("fs").rmdirSync(tmpDir); } catch {}
  }
}

export async function synthesizeChunk(
  text: string,
  voiceId?: string
): Promise<{ audio: Buffer; charCount: number }> {
  // Mock mode: generate silent MP3 instead of calling ElevenLabs
  if (USE_MOCK_TTS) {
    const audio = generateMockAudio(text);
    return { audio, charCount: text.length };
  }

  const voice = voiceId ?? config.elevenlabs.voiceId();
  const url = `${BASE_URL}/text-to-speech/${voice}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": config.elevenlabs.apiKey(),
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errorBody}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return { audio: Buffer.from(arrayBuffer), charCount: text.length };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw new Error(`ElevenLabs synthesis failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
