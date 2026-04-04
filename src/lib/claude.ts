import Anthropic from "@anthropic-ai/sdk";
import { config } from "./config";

let client: Anthropic | null = null;

function getClaude(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropic.apiKey() });
  }
  return client;
}

export interface ClaudeResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export async function askClaude(
  prompt: string,
  options: { model?: string; maxTokens?: number; system?: string } = {}
): Promise<ClaudeResponse> {
  const claude = getClaude();
  const model = options.model ?? "claude-haiku-4-20250414";
  const maxTokens = options.maxTokens ?? 4096;

  const response = await claude.messages.create({
    model,
    max_tokens: maxTokens,
    system: options.system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
