import { execSync } from "child_process";
import { readFileSync, unlinkSync, mkdtempSync } from "fs";
import path from "path";
import os from "os";

const MAX_CHUNK_CHARS = 4096; // OpenAI TTS supports up to 4096 chars per request
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 15000];
const USE_MOCK_TTS = process.env.MOCK_TTS === "true";
const TTS_PROVIDER = process.env.TTS_PROVIDER ?? "openai"; // "openai" | "elevenlabs" | "mock"

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

function generateMockAudio(): Buffer {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "mock-tts-"));
  const outPath = path.join(tmpDir, "mock.mp3");
  try {
    execSync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 3 -codec:a libmp3lame -b:a 128k "${outPath}"`,
      { stdio: "pipe" }
    );
    return readFileSync(outPath);
  } finally {
    try { unlinkSync(outPath); } catch {}
    try { require("fs").rmdirSync(tmpDir); } catch {}
  }
}

async function synthesizeOpenAI(
  text: string,
  voice: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice,
          response_format: "mp3",
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI TTS error ${response.status}: ${errorBody}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw new Error(`OpenAI TTS failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

async function synthesizeElevenLabs(
  text: string,
  voiceId: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_turbo_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ElevenLabs error ${response.status}: ${errorBody}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  throw new Error(`ElevenLabs failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

export async function synthesizeChunk(
  text: string,
  voiceId?: string
): Promise<{ audio: Buffer; charCount: number }> {
  if (USE_MOCK_TTS || TTS_PROVIDER === "mock") {
    return { audio: generateMockAudio(), charCount: text.length };
  }

  let audio: Buffer;

  if (TTS_PROVIDER === "elevenlabs") {
    const voice = voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "";
    audio = await synthesizeElevenLabs(text, voice);
  } else {
    // Default: OpenAI TTS
    // Voice options: alloy, echo, fable, onyx, nova, shimmer
    const voice = process.env.OPENAI_TTS_VOICE ?? "onyx";
    audio = await synthesizeOpenAI(text, voice);
  }

  return { audio, charCount: text.length };
}
