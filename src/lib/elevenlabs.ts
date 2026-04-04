import { config } from "./config";

const BASE_URL = "https://api.elevenlabs.io/v1";
const MAX_CHUNK_CHARS = 2400;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 30000];

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

export async function synthesizeChunk(
  text: string,
  voiceId?: string
): Promise<{ audio: Buffer; charCount: number }> {
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
