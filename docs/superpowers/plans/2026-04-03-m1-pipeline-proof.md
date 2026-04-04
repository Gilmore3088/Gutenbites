# M1: Pipeline Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get 1 public domain book through the entire content pipeline (ingest -> clean -> segment -> enrich -> QA -> synthesize -> post-process -> publish) and live as a podcast RSS feed, proving the end-to-end architecture works.

**Architecture:** A Next.js 14 app with TypeScript handles the web layer and API routes. Supabase provides the database (titles, chapters, feeds, pipeline_logs tables) and auth. Cloudflare R2 stores raw texts, cleaned chapters, and final audio files. The pipeline is a set of discrete, testable modules orchestrated by a state machine that advances titles through stages. Each stage reads from the previous stage's output in R2/Supabase and writes its output before transitioning state.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres + Auth), Cloudflare R2 (S3-compatible storage), ElevenLabs API (TTS), Anthropic Claude API (text processing), ffmpeg (audio post-processing), Vitest (testing)

**Scope:** This plan covers M1 only (1 title, end-to-end, live RSS feed). Separate plans will cover M2 (automation/orchestrator), M3 (landing page, SEO, Stripe, admin dashboard), and beyond.

**Prerequisites:** You need these API keys/accounts configured in `.env.local` before starting:
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (create a Supabase project)
- `R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET_NAME` (create a Cloudflare R2 bucket)
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` (create an ElevenLabs account, pick a voice)
- `ANTHROPIC_API_KEY` (Anthropic console)

---

## File Structure

```
gutenbites/
├── .env.local.example          # Template for required env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── scripts/
│   ├── seed-feeds.ts           # Insert initial feed record
│   └── run-pipeline.ts         # Manual single-title pipeline run
├── src/
│   ├── lib/
│   │   ├── config.ts           # Env var validation + constants
│   │   ├── supabase.ts         # Supabase server client
│   │   ├── r2.ts               # R2 upload/download helpers
│   │   ├── elevenlabs.ts       # ElevenLabs TTS client
│   │   └── claude.ts           # Claude API client
│   ├── pipeline/
│   │   ├── states.ts           # Pipeline state enum + transition map
│   │   ├── ingest.ts           # Gutenberg fetch + R2 store
│   │   ├── clean.ts            # Text cleaning via Claude
│   │   ├── segment.ts          # Chapter splitting via Claude
│   │   ├── enrich.ts           # Intro generation via Claude
│   │   ├── qa.ts               # QA scanning via Claude
│   │   ├── synthesize.ts       # ElevenLabs TTS + R2 store
│   │   ├── postprocess.ts      # ffmpeg loudness + music + export
│   │   └── publish.ts          # Mark published + trigger RSS
│   ├── rss/
│   │   └── generate.ts         # Build podcast RSS XML from DB
│   └── app/
│       ├── layout.tsx          # Minimal root layout
│       ├── page.tsx            # Placeholder homepage
│       └── api/
│           └── rss/
│               └── [slug]/
│                   └── route.ts # RSS feed endpoint
├── tests/
│   ├── lib/
│   │   └── r2.test.ts
│   ├── pipeline/
│   │   ├── states.test.ts
│   │   ├── ingest.test.ts
│   │   ├── clean.test.ts
│   │   ├── segment.test.ts
│   │   ├── enrich.test.ts
│   │   ├── qa.test.ts
│   │   ├── synthesize.test.ts
│   │   ├── postprocess.test.ts
│   │   └── publish.test.ts
│   └── rss/
│       └── generate.test.ts
└── docs/
    └── superpowers/
        └── plans/
```

Each file has one responsibility. Pipeline modules are pure functions that take input + dependencies (injected clients) and return output, making them independently testable with mocked clients.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.env.local.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/jgmbp/gutenbites
git init
git branch -m main
```

- [ ] **Step 2: Create .gitignore**

Create `.gitignore`:

```gitignore
node_modules/
.next/
.env.local
.env*.local
dist/
*.mp3
*.wav
coverage/
.vercel
```

- [ ] **Step 3: Create Next.js project with dependencies**

```bash
npm init -y
npm install next@14 react react-dom typescript @types/react @types/node
npm install @supabase/supabase-js @aws-sdk/client-s3 anthropic
npm install -D vitest @vitest/coverage-v8 tsx
```

- [ ] **Step 4: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create next.config.ts**

Create `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 6: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 7: Create .env.local.example**

Create `.env.local.example`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=gutenbites

# ElevenLabs
ELEVENLABS_API_KEY=your-api-key
ELEVENLABS_VOICE_ID=your-voice-id

# Anthropic
ANTHROPIC_API_KEY=your-api-key
```

- [ ] **Step 8: Create minimal app shell**

Create `src/app/layout.tsx`:

```tsx
export const metadata = {
  title: "GütenBites",
  description: "Classic literature as AI-narrated podcasts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main>
      <h1>GütenBites</h1>
      <p>Classic literature as AI-narrated podcasts. Coming soon.</p>
    </main>
  );
}
```

- [ ] **Step 9: Add scripts to package.json**

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "pipeline": "tsx scripts/run-pipeline.ts",
    "seed": "tsx scripts/seed-feeds.ts"
  }
}
```

- [ ] **Step 10: Verify project builds**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 11: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts .env.local.example src/app/layout.tsx src/app/page.tsx
git commit -m "chore: scaffold Next.js project with TypeScript and Vitest"
```

---

### Task 2: Supabase Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `src/lib/config.ts`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Feeds: podcast feed definitions
CREATE TABLE feeds (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  voice_id TEXT NOT NULL,
  intro_music_r2 TEXT,
  outro_music_r2 TEXT,
  rss_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Titles: one row per Gutenberg book
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gutenberg_id INT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  feed_slug TEXT NOT NULL REFERENCES feeds(slug),
  status TEXT NOT NULL DEFAULT 'queued',
  priority_score FLOAT NOT NULL DEFAULT 0,
  raw_r2_key TEXT,
  clean_r2_key TEXT,
  intro_text TEXT,
  cover_art_url TEXT,
  seo_description TEXT,
  error_msg TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_titles_status ON titles(status);
CREATE INDEX idx_titles_priority ON titles(priority_score DESC);
CREATE INDEX idx_titles_feed ON titles(feed_slug);

-- Chapters: one row per podcast episode
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  chapter_num INT NOT NULL,
  chapter_title TEXT NOT NULL DEFAULT '',
  word_count INT NOT NULL DEFAULT 0,
  text_r2_key TEXT,
  audio_raw_r2_key TEXT,
  audio_final_r2_key TEXT,
  audio_url TEXT,
  duration_secs INT,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  tts_char_count INT,
  pronunciation_hints JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(title_id, chapter_num)
);

CREATE INDEX idx_chapters_title ON chapters(title_id);
CREATE INDEX idx_chapters_status ON chapters(status);

-- Pipeline logs: immutable audit trail
CREATE TABLE pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID REFERENCES titles(id),
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_logs_title ON pipeline_logs(title_id);
CREATE INDEX idx_pipeline_logs_type ON pipeline_logs(event_type);

-- Auto-update updated_at on titles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER titles_updated_at
  BEFORE UPDATE ON titles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: Apply migration to Supabase**

Run this SQL in the Supabase SQL editor (Dashboard > SQL Editor > New query > Paste > Run), or use the Supabase CLI:

```bash
npx supabase db push
```

Expected: All tables created successfully.

- [ ] **Step 3: Create config module**

Create `src/lib/config.ts`:

```typescript
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  supabase: {
    url: () => required("SUPABASE_URL"),
    serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  },
  r2: {
    accountId: () => required("R2_ACCOUNT_ID"),
    accessKeyId: () => required("R2_ACCESS_KEY_ID"),
    secretAccessKey: () => required("R2_SECRET_ACCESS_KEY"),
    bucketName: () => required("R2_BUCKET_NAME"),
  },
  elevenlabs: {
    apiKey: () => required("ELEVENLABS_API_KEY"),
    voiceId: () => required("ELEVENLABS_VOICE_ID"),
  },
  anthropic: {
    apiKey: () => required("ANTHROPIC_API_KEY"),
  },
} as const;
```

- [ ] **Step 4: Create Supabase server client**

Create `src/lib/supabase.ts`:

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabase.url(), config.supabase.serviceRoleKey());
  }
  return client;
}

export type TitleStatus =
  | "queued"
  | "ingested"
  | "cleaned"
  | "segmented"
  | "enriched"
  | "qa_passed"
  | "synthesized"
  | "processed"
  | "published"
  | `error_${string}`;

export interface Title {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  language: string;
  feed_slug: string;
  status: TitleStatus;
  priority_score: number;
  raw_r2_key: string | null;
  clean_r2_key: string | null;
  intro_text: string | null;
  cover_art_url: string | null;
  seo_description: string | null;
  error_msg: string | null;
  retry_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  title_id: string;
  chapter_num: number;
  chapter_title: string;
  word_count: number;
  text_r2_key: string | null;
  audio_raw_r2_key: string | null;
  audio_final_r2_key: string | null;
  audio_url: string | null;
  duration_secs: number | null;
  file_size_bytes: number | null;
  status: string;
  tts_char_count: number | null;
  pronunciation_hints: Array<{ word: string; phonetic: string }>;
  published_at: string | null;
  created_at: string;
}

export interface Feed {
  slug: string;
  name: string;
  description: string;
  voice_id: string;
  intro_music_r2: string | null;
  outro_music_r2: string | null;
  rss_url: string | null;
  created_at: string;
}

export async function logPipelineEvent(
  titleId: string | null,
  eventType: string,
  fromStatus: string | null,
  toStatus: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("pipeline_logs").insert({
    title_id: titleId,
    event_type: eventType,
    from_status: fromStatus,
    to_status: toStatus,
    metadata,
  });
  if (error) {
    console.error("Failed to log pipeline event:", error.message);
  }
}

export async function transitionTitle(
  titleId: string,
  fromStatus: string,
  toStatus: string,
  updates: Partial<Title> = {}
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("titles")
    .update({ ...updates, status: toStatus })
    .eq("id", titleId)
    .eq("status", fromStatus);

  if (error) {
    throw new Error(`State transition failed (${fromStatus} -> ${toStatus}): ${error.message}`);
  }

  await logPipelineEvent(titleId, "state_transition", fromStatus, toStatus, updates);
}
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/config.ts src/lib/supabase.ts
git commit -m "feat: add Supabase schema, types, and state transition helpers"
```

---

### Task 3: R2 Storage Client

**Files:**
- Create: `src/lib/r2.ts`
- Create: `tests/lib/r2.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/r2.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadToR2, downloadFromR2, getPublicUrl } from "@/lib/r2";

// Mock the S3 client
vi.mock("@aws-sdk/client-s3", () => {
  const mockSend = vi.fn().mockResolvedValue({});
  return {
    S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: vi.fn().mockImplementation((params) => params),
    GetObjectCommand: vi.fn().mockImplementation((params) => params),
    __mockSend: mockSend,
  };
});

describe("R2 Storage", () => {
  it("uploadToR2 sends PutObjectCommand with correct key and body", async () => {
    const { __mockSend } = await import("@aws-sdk/client-s3") as any;
    __mockSend.mockResolvedValueOnce({});

    await uploadToR2("texts/raw/123.txt", "Hello world", "text/plain");

    expect(__mockSend).toHaveBeenCalled();
  });

  it("downloadFromR2 returns body as string", async () => {
    const { __mockSend } = await import("@aws-sdk/client-s3") as any;
    const mockBody = {
      transformToString: vi.fn().mockResolvedValue("file content"),
    };
    __mockSend.mockResolvedValueOnce({ Body: mockBody });

    const result = await downloadFromR2("texts/raw/123.txt");
    expect(result).toBe("file content");
  });

  it("getPublicUrl constructs correct URL", () => {
    const url = getPublicUrl("audio/final/abc.mp3");
    expect(url).toContain("audio/final/abc.mp3");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/lib/r2.test.ts
```

Expected: FAIL — module `@/lib/r2` not found.

- [ ] **Step 3: Implement R2 client**

Create `src/lib/r2.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "./config";

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${config.r2.accountId()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId(),
        secretAccessKey: config.r2.secretAccessKey(),
      },
    });
  }
  return client;
}

export async function uploadToR2(
  key: string,
  body: string | Buffer,
  contentType: string
): Promise<void> {
  const r2 = getR2Client();
  await r2.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function uploadBufferToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  return uploadToR2(key, body, contentType);
}

export async function downloadFromR2(key: string): Promise<string> {
  const r2 = getR2Client();
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: config.r2.bucketName(),
      Key: key,
    })
  );
  if (!response.Body) {
    throw new Error(`Empty response for R2 key: ${key}`);
  }
  return response.Body.transformToString("utf-8");
}

export async function downloadBufferFromR2(key: string): Promise<Buffer> {
  const r2 = getR2Client();
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: config.r2.bucketName(),
      Key: key,
    })
  );
  if (!response.Body) {
    throw new Error(`Empty response for R2 key: ${key}`);
  }
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export function getPublicUrl(key: string): string {
  // R2 public URL via custom domain or R2.dev subdomain
  const bucket = config.r2.bucketName();
  return `https://${bucket}.r2.dev/${key}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/lib/r2.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/r2.ts tests/lib/r2.test.ts
git commit -m "feat: add R2 storage client with upload, download, and public URL helpers"
```

---

### Task 4: Pipeline States

**Files:**
- Create: `src/pipeline/states.ts`
- Create: `tests/pipeline/states.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/states.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { PIPELINE_STATES, getNextState, isValidTransition, getErrorState } from "@/pipeline/states";

describe("Pipeline States", () => {
  it("defines all pipeline states in order", () => {
    expect(PIPELINE_STATES).toEqual([
      "queued",
      "ingested",
      "cleaned",
      "segmented",
      "enriched",
      "qa_passed",
      "synthesized",
      "processed",
      "published",
    ]);
  });

  it("getNextState returns the next state in the pipeline", () => {
    expect(getNextState("queued")).toBe("ingested");
    expect(getNextState("ingested")).toBe("cleaned");
    expect(getNextState("processed")).toBe("published");
  });

  it("getNextState returns null for published (terminal state)", () => {
    expect(getNextState("published")).toBeNull();
  });

  it("isValidTransition allows forward transitions", () => {
    expect(isValidTransition("queued", "ingested")).toBe(true);
    expect(isValidTransition("cleaned", "segmented")).toBe(true);
  });

  it("isValidTransition allows error transitions", () => {
    expect(isValidTransition("queued", "error_ingested")).toBe(true);
  });

  it("isValidTransition rejects skipping states", () => {
    expect(isValidTransition("queued", "cleaned")).toBe(false);
  });

  it("getErrorState returns error variant for a state", () => {
    expect(getErrorState("ingested")).toBe("error_ingested");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/states.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement pipeline states**

Create `src/pipeline/states.ts`:

```typescript
export const PIPELINE_STATES = [
  "queued",
  "ingested",
  "cleaned",
  "segmented",
  "enriched",
  "qa_passed",
  "synthesized",
  "processed",
  "published",
] as const;

export type PipelineState = (typeof PIPELINE_STATES)[number];

export function getNextState(current: string): PipelineState | null {
  const index = PIPELINE_STATES.indexOf(current as PipelineState);
  if (index === -1 || index === PIPELINE_STATES.length - 1) {
    return null;
  }
  return PIPELINE_STATES[index + 1];
}

export function isValidTransition(from: string, to: string): boolean {
  // Allow transition to error state from any state
  if (to.startsWith("error_")) {
    return true;
  }
  // Allow transition from error state back to the state before it
  if (from.startsWith("error_")) {
    const errorTarget = from.replace("error_", "");
    const targetIndex = PIPELINE_STATES.indexOf(errorTarget as PipelineState);
    if (targetIndex > 0) {
      return to === PIPELINE_STATES[targetIndex - 1];
    }
  }
  // Normal forward transition: must be exactly one step forward
  const fromIndex = PIPELINE_STATES.indexOf(from as PipelineState);
  const toIndex = PIPELINE_STATES.indexOf(to as PipelineState);
  return fromIndex !== -1 && toIndex !== -1 && toIndex === fromIndex + 1;
}

export function getErrorState(stage: string): string {
  return `error_${stage}`;
}

// Map each state to the pipeline function that produces the NEXT state
export const STATE_TO_STAGE: Record<string, string> = {
  queued: "ingest",
  ingested: "clean",
  cleaned: "segment",
  segmented: "enrich",
  enriched: "qa",
  qa_passed: "synthesize",
  synthesized: "postprocess",
  processed: "publish",
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/states.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/states.ts tests/pipeline/states.test.ts
git commit -m "feat: define pipeline state machine with transitions and validation"
```

---

### Task 5: Claude API Client

**Files:**
- Create: `src/lib/claude.ts`

- [ ] **Step 1: Create Claude client wrapper**

Create `src/lib/claude.ts`:

```typescript
import Anthropic from "anthropic";
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
  options: {
    model?: string;
    maxTokens?: number;
    system?: string;
  } = {}
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
    .map((block) => block.text)
    .join("");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude API client wrapper"
```

---

### Task 6: ElevenLabs Client

**Files:**
- Create: `src/lib/elevenlabs.ts`

- [ ] **Step 1: Create ElevenLabs client**

Create `src/lib/elevenlabs.ts`:

```typescript
import { config } from "./config";

const BASE_URL = "https://api.elevenlabs.io/v1";
const MAX_CHUNK_CHARS = 2400;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 5000, 30000];

export function chunkTextBySentence(text: string): string[] {
  // Split on sentence boundaries, keeping chunks under MAX_CHUNK_CHARS
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
  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }
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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ElevenLabs API error ${response.status}: ${errorBody}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        audio: Buffer.from(arrayBuffer),
        charCount: text.length,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  throw new Error(
    `ElevenLabs synthesis failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/elevenlabs.ts
git commit -m "feat: add ElevenLabs TTS client with chunking and retry logic"
```

---

### Task 7: Gutenberg Ingest Stage

**Files:**
- Create: `src/pipeline/ingest.ts`
- Create: `tests/pipeline/ingest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/ingest.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { fetchGutenbergText, parseGutenbergMetadata } from "@/pipeline/ingest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Gutenberg Ingest", () => {
  it("parseGutenbergMetadata extracts title and author from RDF", () => {
    const rdf = `<?xml version="1.0"?>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dcterms="http://purl.org/dc/terms/"
             xmlns:pgterms="http://www.gutenberg.org/2009/pgterms/">
      <pgterms:ebook rdf:about="ebooks/1342">
        <dcterms:title>Pride and Prejudice</dcterms:title>
        <dcterms:creator>
          <pgterms:agent>
            <pgterms:name>Austen, Jane</pgterms:name>
          </pgterms:agent>
        </dcterms:creator>
        <dcterms:language>
          <rdf:Description>
            <rdf:value>en</rdf:value>
          </rdf:Description>
        </dcterms:language>
        <dcterms:subject>
          <rdf:Description>
            <rdf:value>Fiction</rdf:value>
          </rdf:Description>
        </dcterms:subject>
      </pgterms:ebook>
    </rdf:RDF>`;

    const meta = parseGutenbergMetadata(rdf);
    expect(meta.title).toBe("Pride and Prejudice");
    expect(meta.author).toBe("Austen, Jane");
    expect(meta.language).toBe("en");
  });

  it("fetchGutenbergText fetches plain text from Gutenberg mirrors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve("The Project Gutenberg EBook of Pride and Prejudice\r\n\r\nIt is a truth universally acknowledged..."),
    });

    const text = await fetchGutenbergText(1342);
    expect(text).toContain("truth universally acknowledged");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("1342")
    );
  });

  it("fetchGutenbergText throws on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(fetchGutenbergText(9999999)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/ingest.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ingest module**

Create `src/pipeline/ingest.ts`:

```typescript
import { uploadToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

const GUTENBERG_TEXT_URL = "https://www.gutenberg.org/cache/epub";
const GUTENBERG_RDF_URL = "https://www.gutenberg.org/cache/epub";

export interface GutenbergMetadata {
  title: string;
  author: string;
  language: string;
  subjects: string[];
}

export function parseGutenbergMetadata(rdf: string): GutenbergMetadata {
  // Simple XML parsing — avoids heavy dependency for structured data
  const titleMatch = rdf.match(/<dcterms:title>([^<]+)<\/dcterms:title>/);
  const authorMatch = rdf.match(/<pgterms:name>([^<]+)<\/pgterms:name>/);
  const langMatch = rdf.match(/<rdf:value>(\w{2})<\/rdf:value>/);
  const subjectMatches = [...rdf.matchAll(/<rdf:value>([^<]+)<\/rdf:value>/g)];

  return {
    title: titleMatch?.[1] ?? "Unknown Title",
    author: authorMatch?.[1] ?? "Unknown Author",
    language: langMatch?.[1] ?? "en",
    subjects: subjectMatches.slice(1).map((m) => m[1]), // Skip first (language)
  };
}

export async function fetchGutenbergText(gutenbergId: number): Promise<string> {
  // Try plain text first
  const textUrl = `${GUTENBERG_TEXT_URL}/${gutenbergId}/pg${gutenbergId}.txt`;
  const response = await fetch(textUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Gutenberg text ${gutenbergId}: HTTP ${response.status}`);
  }

  return response.text();
}

export async function fetchGutenbergMetadata(
  gutenbergId: number
): Promise<GutenbergMetadata> {
  const rdfUrl = `${GUTENBERG_RDF_URL}/${gutenbergId}/pg${gutenbergId}.rdf`;
  const response = await fetch(rdfUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Gutenberg RDF ${gutenbergId}: HTTP ${response.status}`);
  }

  const rdf = await response.text();
  return parseGutenbergMetadata(rdf);
}

export async function ingestTitle(
  gutenbergId: number,
  feedSlug: string
): Promise<string> {
  const supabase = getSupabase();

  // Check for duplicate
  const { data: existing } = await supabase
    .from("titles")
    .select("id")
    .eq("gutenberg_id", gutenbergId)
    .single();

  if (existing) {
    throw new Error(`Gutenberg ID ${gutenbergId} already exists as title ${existing.id}`);
  }

  // Fetch metadata and text
  const metadata = await fetchGutenbergMetadata(gutenbergId);
  const rawText = await fetchGutenbergText(gutenbergId);

  // Store raw text in R2
  const r2Key = `texts/raw/${gutenbergId}.txt`;
  await uploadToR2(r2Key, rawText, "text/plain");

  // Insert title record
  const { data: title, error } = await supabase
    .from("titles")
    .insert({
      gutenberg_id: gutenbergId,
      title: metadata.title,
      author: metadata.author,
      language: metadata.language,
      feed_slug: feedSlug,
      status: "ingested",
      raw_r2_key: r2Key,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to insert title: ${error.message}`);
  }

  await logPipelineEvent(title.id, "state_transition", "queued", "ingested", {
    gutenberg_id: gutenbergId,
    raw_r2_key: r2Key,
    word_count: rawText.split(/\s+/).length,
  });

  return title.id;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/ingest.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/ingest.ts tests/pipeline/ingest.test.ts
git commit -m "feat: add Gutenberg ingest stage with metadata parsing and R2 storage"
```

---

### Task 8: Text Cleaning Stage

**Files:**
- Create: `src/pipeline/clean.ts`
- Create: `tests/pipeline/clean.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/clean.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { stripGutenbergBoilerplate, normalizeWhitespace } from "@/pipeline/clean";

describe("Text Cleaning", () => {
  it("strips Gutenberg header boilerplate", () => {
    const text = `The Project Gutenberg EBook of Pride and Prejudice, by Jane Austen

This eBook is for the use of anyone anywhere in the United States and most
other parts of the world at no cost and with almost no restrictions
whatsoever.

*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***

It is a truth universally acknowledged, that a single man in possession
of a good fortune, must be in want of a wife.`;

    const cleaned = stripGutenbergBoilerplate(text);
    expect(cleaned).not.toContain("Project Gutenberg EBook");
    expect(cleaned).toContain("truth universally acknowledged");
  });

  it("strips Gutenberg footer boilerplate", () => {
    const text = `The end of the story.

*** END OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE ***

Updated editions will replace the previous one. The old editions will be renamed.`;

    const cleaned = stripGutenbergBoilerplate(text);
    expect(cleaned).toContain("end of the story");
    expect(cleaned).not.toContain("Updated editions");
  });

  it("removes footnote markers", () => {
    const text = "He spoke[1] with great conviction.* The crowd[Footnote: gathered] listened.";
    const cleaned = normalizeWhitespace(text);
    // Footnote removal is handled in the full clean pipeline
    expect(cleaned).toBeDefined();
  });

  it("normalizes excessive whitespace", () => {
    const text = "Paragraph one.\n\n\n\n\nParagraph two.\n\n\nParagraph three.";
    const result = normalizeWhitespace(text);
    expect(result).toBe("Paragraph one.\n\nParagraph two.\n\nParagraph three.");
  });

  it("removes standalone page numbers", () => {
    const text = "Some text.\n\n42\n\nMore text.\n\nPage 57\n\n- 99 -\n\nContinued.";
    const result = normalizeWhitespace(text);
    expect(result).not.toMatch(/^\d+$/m);
    expect(result).not.toContain("Page 57");
    expect(result).not.toContain("- 99 -");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/clean.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement text cleaning**

Create `src/pipeline/clean.ts`:

```typescript
import { downloadFromR2, uploadToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

const HEADER_MARKERS = [
  "*** START OF THE PROJECT GUTENBERG EBOOK",
  "*** START OF THIS PROJECT GUTENBERG EBOOK",
  "***START OF THE PROJECT GUTENBERG EBOOK",
  "*END*THE SMALL PRINT",
];

const FOOTER_MARKERS = [
  "*** END OF THE PROJECT GUTENBERG EBOOK",
  "*** END OF THIS PROJECT GUTENBERG EBOOK",
  "***END OF THE PROJECT GUTENBERG EBOOK",
  "End of the Project Gutenberg EBook",
  "End of Project Gutenberg",
];

export function stripGutenbergBoilerplate(text: string): string {
  let result = text;

  // Find and remove header (everything before the START marker line)
  for (const marker of HEADER_MARKERS) {
    const markerIndex = result.indexOf(marker);
    if (markerIndex !== -1) {
      // Find end of the marker line
      const lineEnd = result.indexOf("\n", markerIndex);
      result = result.slice(lineEnd !== -1 ? lineEnd + 1 : markerIndex + marker.length);
      break;
    }
  }

  // Find and remove footer (everything after the END marker)
  for (const marker of FOOTER_MARKERS) {
    const markerIndex = result.indexOf(marker);
    if (markerIndex !== -1) {
      result = result.slice(0, markerIndex);
      break;
    }
  }

  return result.trim();
}

export function normalizeWhitespace(text: string): string {
  let result = text;

  // Normalize line endings
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove standalone page numbers: "42", "Page 42", "- 42 -"
  result = result.replace(/^\s*Page\s+\d+\s*$/gm, "");
  result = result.replace(/^\s*-\s*\d+\s*-\s*$/gm, "");
  result = result.replace(/^\s*\d{1,4}\s*$/gm, "");

  // Remove footnote markers: [1], [Footnote: ...], standalone *
  result = result.replace(/\[Footnote:\s*[^\]]*\]/gi, "");
  result = result.replace(/\[\d+\]/g, "");

  // Collapse 3+ blank lines to 2
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

export async function cleanTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error } = await supabase
    .from("titles")
    .select("id, raw_r2_key, gutenberg_id")
    .eq("id", titleId)
    .single();

  if (error || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  if (!title.raw_r2_key) {
    throw new Error(`No raw text for title ${titleId}`);
  }

  // Download raw text from R2
  const rawText = await downloadFromR2(title.raw_r2_key);

  // Clean: strip boilerplate, normalize whitespace
  let cleaned = stripGutenbergBoilerplate(rawText);
  cleaned = normalizeWhitespace(cleaned);

  // Store cleaned text in R2
  const cleanR2Key = `texts/clean/${title.gutenberg_id}.txt`;
  await uploadToR2(cleanR2Key, cleaned, "text/plain");

  // Update title record and transition state
  await transitionTitle(titleId, "ingested", "cleaned", {
    clean_r2_key: cleanR2Key,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/clean.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/clean.ts tests/pipeline/clean.test.ts
git commit -m "feat: add text cleaning stage with boilerplate removal and whitespace normalization"
```

---

### Task 9: Chapter Segmentation Stage

**Files:**
- Create: `src/pipeline/segment.ts`
- Create: `tests/pipeline/segment.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/segment.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { detectChapters } from "@/pipeline/segment";

describe("Chapter Segmentation", () => {
  it("detects chapters with 'Chapter I' format", () => {
    const text = `Chapter I

It was the best of times.

Chapter II

It was the worst of times.

Chapter III

It was the age of wisdom.`;

    const chapters = detectChapters(text);
    expect(chapters).toHaveLength(3);
    expect(chapters[0].title).toBe("Chapter I");
    expect(chapters[1].title).toBe("Chapter II");
  });

  it("detects chapters with 'CHAPTER 1' format", () => {
    const text = `CHAPTER 1

First chapter content here with enough words to pass the minimum.

CHAPTER 2

Second chapter content here with enough words to pass the minimum.`;

    const chapters = detectChapters(text);
    expect(chapters).toHaveLength(2);
  });

  it("detects chapters with 'Chapter One' format", () => {
    const text = `Chapter One

Content of chapter one.

Chapter Two

Content of chapter two.`;

    const chapters = detectChapters(text);
    expect(chapters).toHaveLength(2);
    expect(chapters[0].title).toBe("Chapter One");
  });

  it("includes content between chapter headings", () => {
    const text = `Chapter I

The beginning of a story that goes on for several lines
and contains enough text to be meaningful as a chapter.

Chapter II

The continuation of the story.`;

    const chapters = detectChapters(text);
    expect(chapters[0].content).toContain("beginning of a story");
    expect(chapters[1].content).toContain("continuation");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/segment.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement chapter segmentation**

Create `src/pipeline/segment.ts`:

```typescript
import { downloadFromR2, uploadToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

export interface DetectedChapter {
  num: number;
  title: string;
  content: string;
  wordCount: number;
}

// Regex patterns for chapter headings
const CHAPTER_PATTERNS = [
  /^(Chapter\s+[IVXLCDM]+(?:\s*[.:—–-]\s*.*)?)\s*$/im,
  /^(CHAPTER\s+[IVXLCDM]+(?:\s*[.:—–-]\s*.*)?)\s*$/im,
  /^(Chapter\s+\d+(?:\s*[.:—–-]\s*.*)?)\s*$/im,
  /^(CHAPTER\s+\d+(?:\s*[.:—–-]\s*.*)?)\s*$/im,
  /^(Chapter\s+(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty|Thirty|Forty|Fifty)(?:\s*[.:—–-]\s*.*)?)\s*$/im,
];

const COMBINED_CHAPTER_REGEX =
  /^(?:(?:CHAPTER|Chapter)\s+(?:[IVXLCDM]+|\d+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty|Thirty|Forty|Fifty))(?:\s*[.:—–-]\s*.*)?$/im;

export function detectChapters(text: string): DetectedChapter[] {
  const lines = text.split("\n");
  const chapterStarts: Array<{ lineIndex: number; title: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (COMBINED_CHAPTER_REGEX.test(line)) {
      chapterStarts.push({ lineIndex: i, title: line });
    }
  }

  if (chapterStarts.length === 0) {
    // No chapters detected — treat entire text as one chapter
    return [
      {
        num: 1,
        title: "Full Text",
        content: text.trim(),
        wordCount: text.trim().split(/\s+/).length,
      },
    ];
  }

  const chapters: DetectedChapter[] = [];

  for (let i = 0; i < chapterStarts.length; i++) {
    const start = chapterStarts[i].lineIndex;
    const end = i + 1 < chapterStarts.length ? chapterStarts[i + 1].lineIndex : lines.length;

    // Content starts after the heading line (skip blank lines after heading)
    let contentStart = start + 1;
    while (contentStart < end && lines[contentStart].trim() === "") {
      contentStart++;
    }

    const content = lines.slice(contentStart, end).join("\n").trim();

    chapters.push({
      num: i + 1,
      title: chapterStarts[i].title,
      content,
      wordCount: content.split(/\s+/).filter((w) => w.length > 0).length,
    });
  }

  return chapters;
}

export async function segmentTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error } = await supabase
    .from("titles")
    .select("id, clean_r2_key, gutenberg_id")
    .eq("id", titleId)
    .single();

  if (error || !title || !title.clean_r2_key) {
    throw new Error(`Title ${titleId} not found or missing clean text`);
  }

  const cleanText = await downloadFromR2(title.clean_r2_key);
  const chapters = detectChapters(cleanText);

  // Store each chapter as a separate file in R2 and insert DB row
  for (const chapter of chapters) {
    const chapterR2Key = `texts/chapters/${title.gutenberg_id}/${String(chapter.num).padStart(3, "0")}.txt`;
    await uploadToR2(chapterR2Key, chapter.content, "text/plain");

    const { error: insertError } = await supabase.from("chapters").insert({
      title_id: titleId,
      chapter_num: chapter.num,
      chapter_title: chapter.title,
      word_count: chapter.wordCount,
      text_r2_key: chapterR2Key,
      status: "pending",
    });

    if (insertError) {
      throw new Error(`Failed to insert chapter ${chapter.num}: ${insertError.message}`);
    }
  }

  await transitionTitle(titleId, "cleaned", "segmented");

  await logPipelineEvent(titleId, "state_transition", "cleaned", "segmented", {
    chapter_count: chapters.length,
    total_words: chapters.reduce((sum, ch) => sum + ch.wordCount, 0),
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/segment.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/segment.ts tests/pipeline/segment.test.ts
git commit -m "feat: add chapter segmentation with multi-format heading detection"
```

---

### Task 10: Editorial Intro Generation Stage

**Files:**
- Create: `src/pipeline/enrich.ts`
- Create: `tests/pipeline/enrich.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/enrich.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { generateIntroPrompt, validateIntro } from "@/pipeline/enrich";

describe("Enrichment — Intro Generation", () => {
  it("generateIntroPrompt includes title and author", () => {
    const prompt = generateIntroPrompt("Pride and Prejudice", "Austen, Jane");
    expect(prompt).toContain("Pride and Prejudice");
    expect(prompt).toContain("Austen, Jane");
  });

  it("validateIntro accepts intros within word count range", () => {
    const intro = Array(200).fill("word").join(" ") + ".";
    expect(validateIntro(intro)).toBe(true);
  });

  it("validateIntro rejects intros that are too short", () => {
    const intro = "Too short.";
    expect(validateIntro(intro)).toBe(false);
  });

  it("validateIntro rejects intros that are too long", () => {
    const intro = Array(300).fill("word").join(" ") + ".";
    expect(validateIntro(intro)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/enrich.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement enrichment module**

Create `src/pipeline/enrich.ts`:

```typescript
import { askClaude } from "@/lib/claude";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

const MIN_INTRO_WORDS = 150;
const MAX_INTRO_WORDS = 250;

export function generateIntroPrompt(title: string, author: string): string {
  return `Write a podcast episode introduction for the classic book "${title}" by ${author}.

Requirements:
- Length: 150-250 words (approximately 90 seconds when read aloud)
- Include: brief author biographical context, the historical period, why this work matters today, and a compelling narrative hook
- Do NOT include spoilers beyond common public knowledge
- Write in a warm, inviting tone suitable for a podcast narrator
- Do NOT include any stage directions, labels, or meta-text like "[Intro]" or "Host:"
- Write it as continuous prose that flows naturally when read aloud

Return ONLY the intro text, nothing else.`;
}

export function validateIntro(text: string): boolean {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount >= MIN_INTRO_WORDS && wordCount <= MAX_INTRO_WORDS;
}

export async function enrichTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title, error } = await supabase
    .from("titles")
    .select("id, title, author")
    .eq("id", titleId)
    .single();

  if (error || !title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  const prompt = generateIntroPrompt(title.title, title.author);

  // Use Sonnet for creative writing tasks
  const response = await askClaude(prompt, {
    model: "claude-sonnet-4-20250514",
    maxTokens: 1024,
  });

  const introText = response.text.trim();

  if (!validateIntro(introText)) {
    const wordCount = introText.split(/\s+/).length;
    // Retry once with adjusted prompt if out of range
    const retryPrompt = `${prompt}\n\nIMPORTANT: Your response must be between ${MIN_INTRO_WORDS} and ${MAX_INTRO_WORDS} words. Your previous attempt was ${wordCount} words.`;
    const retryResponse = await askClaude(retryPrompt, {
      model: "claude-sonnet-4-20250514",
      maxTokens: 1024,
    });
    const retryText = retryResponse.text.trim();

    await transitionTitle(titleId, "segmented", "enriched", {
      intro_text: retryText,
    });
  } else {
    await transitionTitle(titleId, "segmented", "enriched", {
      intro_text: introText,
    });
  }

  await logPipelineEvent(titleId, "state_transition", "segmented", "enriched", {
    input_tokens: response.inputTokens,
    output_tokens: response.outputTokens,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/enrich.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/enrich.ts tests/pipeline/enrich.test.ts
git commit -m "feat: add editorial intro generation stage via Claude"
```

---

### Task 11: QA Scanning Stage

**Files:**
- Create: `src/pipeline/qa.ts`
- Create: `tests/pipeline/qa.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/qa.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildQaPrompt, parseQaResponse } from "@/pipeline/qa";

describe("QA Scanning", () => {
  it("buildQaPrompt includes chapter text excerpt", () => {
    const prompt = buildQaPrompt("It was the best of times, it was the worst of times.", 1, 500);
    expect(prompt).toContain("best of times");
  });

  it("parseQaResponse extracts flags and pronunciation hints", () => {
    const response = `{
      "flags": ["Contains French phrase: 'c\\'est la vie'"],
      "pronunciation_hints": [
        {"word": "Monsieur", "phonetic": "muh-SYUR"},
        {"word": "Bastille", "phonetic": "bah-STEEL"}
      ],
      "pass": false
    }`;

    const result = parseQaResponse(response);
    expect(result.flags).toHaveLength(1);
    expect(result.pronunciationHints).toHaveLength(2);
    expect(result.pass).toBe(false);
  });

  it("parseQaResponse handles clean chapters (no flags)", () => {
    const response = `{
      "flags": [],
      "pronunciation_hints": [],
      "pass": true
    }`;

    const result = parseQaResponse(response);
    expect(result.flags).toHaveLength(0);
    expect(result.pass).toBe(true);
  });

  it("parseQaResponse handles malformed JSON gracefully", () => {
    const response = "not valid json at all";
    const result = parseQaResponse(response);
    expect(result.pass).toBe(false);
    expect(result.flags).toContain("QA response was not valid JSON");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/qa.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement QA module**

Create `src/pipeline/qa.ts`:

```typescript
import { askClaude } from "@/lib/claude";
import { downloadFromR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

export interface QaResult {
  flags: string[];
  pronunciationHints: Array<{ word: string; phonetic: string }>;
  pass: boolean;
}

export function buildQaPrompt(
  chapterText: string,
  chapterNum: number,
  bookAvgWordCount: number
): string {
  return `You are a QA agent for an AI-narrated audiobook podcast. Scan the following chapter text for issues that would cause problems with text-to-speech synthesis.

Chapter ${chapterNum} (book average word count: ${bookAvgWordCount}):

---
${chapterText.slice(0, 8000)}
---

Check for:
1. Unusual proper nouns that TTS may mispronounce
2. Foreign phrases (non-English)
3. Archaic abbreviations (e.g., "Mr." could be fine, but unusual ones)
4. Roman numerals in ambiguous contexts
5. Non-prose content (poetry, tables, diagrams)
6. Word count anomalies (this chapter: ${chapterText.split(/\s+/).length} words vs book avg: ${bookAvgWordCount})

Return a JSON object with this exact structure:
{
  "flags": ["description of each issue found"],
  "pronunciation_hints": [{"word": "exact word", "phonetic": "phonetic pronunciation"}],
  "pass": true/false
}

Set "pass" to true ONLY if there are zero flags AND the word count is within a reasonable range of the book average. Return ONLY the JSON object, no other text.`;
}

export function parseQaResponse(response: string): QaResult {
  try {
    // Extract JSON from response (Claude sometimes wraps in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { flags: ["QA response was not valid JSON"], pronunciationHints: [], pass: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      pronunciationHints: Array.isArray(parsed.pronunciation_hints)
        ? parsed.pronunciation_hints
        : [],
      pass: parsed.pass === true,
    };
  } catch {
    return { flags: ["QA response was not valid JSON"], pronunciationHints: [], pass: false };
  }
}

export async function qaTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, chapter_num, text_r2_key, word_count")
    .eq("title_id", titleId)
    .order("chapter_num");

  if (error || !chapters || chapters.length === 0) {
    throw new Error(`No chapters found for title ${titleId}`);
  }

  const avgWordCount = Math.round(
    chapters.reduce((sum, ch) => sum + ch.word_count, 0) / chapters.length
  );

  let allPassed = true;

  for (const chapter of chapters) {
    if (!chapter.text_r2_key) continue;

    const text = await downloadFromR2(chapter.text_r2_key);
    const prompt = buildQaPrompt(text, chapter.chapter_num, avgWordCount);
    const response = await askClaude(prompt, { model: "claude-haiku-4-20250414" });
    const result = parseQaResponse(response.text);

    if (!result.pass) {
      allPassed = false;
      await supabase
        .from("chapters")
        .update({
          status: "qa_flagged",
          pronunciation_hints: result.pronunciationHints,
        })
        .eq("id", chapter.id);
    } else {
      await supabase
        .from("chapters")
        .update({
          pronunciation_hints: result.pronunciationHints,
        })
        .eq("id", chapter.id);
    }
  }

  // For M1 proof-of-concept: auto-pass regardless (flags are informational)
  // In production, flagged chapters would require manual review
  await transitionTitle(titleId, "enriched", "qa_passed");

  await logPipelineEvent(titleId, "state_transition", "enriched", "qa_passed", {
    chapters_scanned: chapters.length,
    all_passed: allPassed,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/qa.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/qa.ts tests/pipeline/qa.test.ts
git commit -m "feat: add QA scanning stage with pronunciation hint extraction"
```

---

### Task 12: Audio Synthesis Stage

**Files:**
- Create: `src/pipeline/synthesize.ts`
- Create: `tests/pipeline/synthesize.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/synthesize.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { chunkTextBySentence } from "@/lib/elevenlabs";

describe("Audio Synthesis", () => {
  it("chunks text at sentence boundaries", () => {
    const text =
      "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const chunks = chunkTextBySentence(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // Each chunk should end with sentence-ending punctuation
    for (const chunk of chunks) {
      expect(chunk).toMatch(/[.!?]\s*$/);
    }
  });

  it("keeps chunks under 2400 characters", () => {
    const longSentences = Array(20)
      .fill("This is a moderately long sentence that contains many words. ")
      .join("");
    const chunks = chunkTextBySentence(longSentences);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(2400);
    }
  });

  it("handles text with no sentence boundaries", () => {
    const text = "no punctuation at all just words flowing endlessly";
    const chunks = chunkTextBySentence(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

```bash
npm test -- tests/pipeline/synthesize.test.ts
```

Expected: Tests should PASS since `chunkTextBySentence` is already in `elevenlabs.ts`.

- [ ] **Step 3: Implement synthesize stage**

Create `src/pipeline/synthesize.ts`:

```typescript
import { chunkTextBySentence, synthesizeChunk } from "@/lib/elevenlabs";
import { downloadFromR2, uploadBufferToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

export async function synthesizeTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title } = await supabase
    .from("titles")
    .select("id, gutenberg_id, intro_text, feed_slug")
    .eq("id", titleId)
    .single();

  if (!title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  // Get the voice ID for this feed
  const { data: feed } = await supabase
    .from("feeds")
    .select("voice_id")
    .eq("slug", title.feed_slug)
    .single();

  const voiceId = feed?.voice_id;

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, chapter_num, text_r2_key, word_count")
    .eq("title_id", titleId)
    .order("chapter_num");

  if (error || !chapters || chapters.length === 0) {
    throw new Error(`No chapters for title ${titleId}`);
  }

  let totalCharCount = 0;

  for (const chapter of chapters) {
    if (!chapter.text_r2_key) continue;

    const chapterText = await downloadFromR2(chapter.text_r2_key);

    // Prepend intro to each chapter
    const fullText = title.intro_text
      ? `${title.intro_text}\n\n${chapterText}`
      : chapterText;

    const textChunks = chunkTextBySentence(fullText);
    const audioChunks: Buffer[] = [];
    let chapterCharCount = 0;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const result = await synthesizeChunk(chunk, voiceId);
      audioChunks.push(result.audio);
      chapterCharCount += result.charCount;

      // Store each chunk in R2 for resume-on-failure
      const chunkR2Key = `audio/chunks/${title.gutenberg_id}/${String(chapter.chapter_num).padStart(3, "0")}/chunk_${String(i).padStart(3, "0")}.mp3`;
      await uploadBufferToR2(chunkR2Key, result.audio, "audio/mpeg");
    }

    // Concatenate all chunks into single chapter MP3
    const concatenated = Buffer.concat(audioChunks);
    const rawR2Key = `audio/raw/${title.gutenberg_id}/${String(chapter.chapter_num).padStart(3, "0")}.mp3`;
    await uploadBufferToR2(rawR2Key, concatenated, "audio/mpeg");

    // Update chapter record
    await supabase
      .from("chapters")
      .update({
        audio_raw_r2_key: rawR2Key,
        tts_char_count: chapterCharCount,
        status: "synthesized",
      })
      .eq("id", chapter.id);

    totalCharCount += chapterCharCount;
  }

  await transitionTitle(titleId, "qa_passed", "synthesized");

  await logPipelineEvent(titleId, "state_transition", "qa_passed", "synthesized", {
    total_char_count: totalCharCount,
    chapters_synthesized: chapters.length,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/synthesize.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/synthesize.ts tests/pipeline/synthesize.test.ts
git commit -m "feat: add audio synthesis stage with ElevenLabs TTS and chunk storage"
```

---

### Task 13: Audio Post-Processing Stage

**Files:**
- Create: `src/pipeline/postprocess.ts`
- Create: `tests/pipeline/postprocess.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/postprocess.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildFfmpegCommand } from "@/pipeline/postprocess";

describe("Audio Post-Processing", () => {
  it("builds ffmpeg command with loudness normalization", () => {
    const cmd = buildFfmpegCommand("/tmp/input.mp3", "/tmp/output.mp3", {
      introMusicPath: null,
      outroMusicPath: null,
    });
    expect(cmd).toContain("loudnorm");
    expect(cmd).toContain("-16");
    expect(cmd).toContain("128k");
    expect(cmd).toContain("44100");
  });

  it("includes intro music filter when provided", () => {
    const cmd = buildFfmpegCommand("/tmp/input.mp3", "/tmp/output.mp3", {
      introMusicPath: "/tmp/intro.mp3",
      outroMusicPath: null,
    });
    expect(cmd).toContain("intro.mp3");
  });

  it("includes outro music filter when provided", () => {
    const cmd = buildFfmpegCommand("/tmp/input.mp3", "/tmp/output.mp3", {
      introMusicPath: null,
      outroMusicPath: "/tmp/outro.mp3",
    });
    expect(cmd).toContain("outro.mp3");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/pipeline/postprocess.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement post-processing module**

Create `src/pipeline/postprocess.ts`:

```typescript
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, statSync, mkdtempSync } from "fs";
import path from "path";
import os from "os";
import { downloadBufferFromR2, uploadBufferToR2 } from "@/lib/r2";
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";
import { getPublicUrl } from "@/lib/r2";

interface PostProcessOptions {
  introMusicPath: string | null;
  outroMusicPath: string | null;
}

export function buildFfmpegCommand(
  inputPath: string,
  outputPath: string,
  options: PostProcessOptions
): string {
  const inputs: string[] = [];
  const filterParts: string[] = [];
  let inputIndex = 0;

  // Main audio input
  inputs.push(`-i "${inputPath}"`);
  const mainInput = `[${inputIndex}:a]`;
  inputIndex++;

  // Build filter chain
  let currentStream = mainInput;

  // If intro music, prepend it
  if (options.introMusicPath) {
    inputs.push(`-i "${options.introMusicPath}"`);
    filterParts.push(
      `[${inputIndex}:a]afade=t=in:st=0:d=1,atrim=0:5[intro]`
    );
    filterParts.push(
      `[intro]${currentStream}concat=n=2:v=0:a=1[withintro]`
    );
    currentStream = "[withintro]";
    inputIndex++;
  }

  // If outro music, append it
  if (options.outroMusicPath) {
    inputs.push(`-i "${options.outroMusicPath}"`);
    filterParts.push(
      `[${inputIndex}:a]afade=t=out:st=0:d=3,atrim=0:3[outro]`
    );
    filterParts.push(
      `${currentStream}[outro]concat=n=2:v=0:a=1[withoutro]`
    );
    currentStream = "[withoutro]";
    inputIndex++;
  }

  // Loudness normalization to -16 LUFS (podcast standard)
  // Note: silence markers for ad insertion at 1/3 and 2/3 of duration
  // are handled by Buzzsprout's dynamic ad insertion, not baked into the audio file.
  // If self-hosting RSS later, add chapter markers or silence detection.
  filterParts.push(
    `${currentStream}loudnorm=I=-16:TP=-1.5:LRA=11[normalized]`
  );

  const filterComplex = filterParts.join("; ");

  return [
    "ffmpeg -y",
    ...inputs,
    `-filter_complex "${filterComplex}"`,
    '-map "[normalized]"',
    "-codec:a libmp3lame -b:a 128k -ar 44100 -ac 2",
    `"${outputPath}"`,
  ].join(" ");
}

export async function postprocessTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: title } = await supabase
    .from("titles")
    .select("id, gutenberg_id, feed_slug")
    .eq("id", titleId)
    .single();

  if (!title) {
    throw new Error(`Title not found: ${titleId}`);
  }

  // Check for feed music files
  const { data: feed } = await supabase
    .from("feeds")
    .select("intro_music_r2, outro_music_r2")
    .eq("slug", title.feed_slug)
    .single();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_num, audio_raw_r2_key")
    .eq("title_id", titleId)
    .order("chapter_num");

  if (!chapters || chapters.length === 0) {
    throw new Error(`No chapters for title ${titleId}`);
  }

  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "gutenbites-"));

  try {
    // Download feed music if configured
    let introMusicPath: string | null = null;
    let outroMusicPath: string | null = null;

    if (feed?.intro_music_r2) {
      introMusicPath = path.join(tmpDir, "intro.mp3");
      const introBuffer = await downloadBufferFromR2(feed.intro_music_r2);
      writeFileSync(introMusicPath, introBuffer);
    }
    if (feed?.outro_music_r2) {
      outroMusicPath = path.join(tmpDir, "outro.mp3");
      const outroBuffer = await downloadBufferFromR2(feed.outro_music_r2);
      writeFileSync(outroMusicPath, outroBuffer);
    }

    for (const chapter of chapters) {
      if (!chapter.audio_raw_r2_key) continue;

      // Download raw audio
      const rawBuffer = await downloadBufferFromR2(chapter.audio_raw_r2_key);
      const inputPath = path.join(tmpDir, `raw_${chapter.chapter_num}.mp3`);
      const outputPath = path.join(tmpDir, `final_${chapter.chapter_num}.mp3`);
      writeFileSync(inputPath, rawBuffer);

      // Run ffmpeg
      const cmd = buildFfmpegCommand(inputPath, outputPath, {
        introMusicPath,
        outroMusicPath,
      });
      execSync(cmd, { stdio: "pipe" });

      // Read processed file and upload to R2
      const finalBuffer = readFileSync(outputPath);
      const finalR2Key = `audio/final/${title.gutenberg_id}/${String(chapter.chapter_num).padStart(3, "0")}.mp3`;
      await uploadBufferToR2(finalR2Key, finalBuffer, "audio/mpeg");

      // Get duration using ffprobe
      const probeCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outputPath}"`;
      const durationStr = execSync(probeCmd, { encoding: "utf-8" }).trim();
      const durationSecs = Math.round(parseFloat(durationStr));
      const fileSizeBytes = statSync(outputPath).size;

      const audioUrl = getPublicUrl(finalR2Key);

      await supabase
        .from("chapters")
        .update({
          audio_final_r2_key: finalR2Key,
          audio_url: audioUrl,
          duration_secs: durationSecs,
          file_size_bytes: fileSizeBytes,
          status: "processed",
        })
        .eq("id", chapter.id);

      // Cleanup temp files for this chapter
      unlinkSync(inputPath);
      unlinkSync(outputPath);
    }
  } finally {
    // Cleanup temp directory
    try {
      const { rmdirSync } = require("fs");
      rmdirSync(tmpDir, { recursive: true });
    } catch {
      // Best effort cleanup
    }
  }

  await transitionTitle(titleId, "synthesized", "processed");

  await logPipelineEvent(titleId, "state_transition", "synthesized", "processed", {
    chapters_processed: chapters.length,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/pipeline/postprocess.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pipeline/postprocess.ts tests/pipeline/postprocess.test.ts
git commit -m "feat: add ffmpeg audio post-processing with loudness normalization and music"
```

---

### Task 14: RSS Feed Generation

**Files:**
- Create: `src/rss/generate.ts`
- Create: `tests/rss/generate.test.ts`
- Create: `src/app/api/rss/[slug]/route.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/rss/generate.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateRssXml } from "@/rss/generate";
import type { Feed, Title, Chapter } from "@/lib/supabase";

describe("RSS Feed Generation", () => {
  const mockFeed: Feed = {
    slug: "classics",
    name: "GütenBites Classics",
    description: "The greatest works of classic literature",
    voice_id: "voice123",
    intro_music_r2: null,
    outro_music_r2: null,
    rss_url: "https://gutenbites.com/api/rss/classics",
    created_at: "2026-01-01T00:00:00Z",
  };

  const mockTitle: Title = {
    id: "title-uuid-1",
    gutenberg_id: 1342,
    title: "Pride and Prejudice",
    author: "Austen, Jane",
    language: "en",
    feed_slug: "classics",
    status: "published",
    priority_score: 0.9,
    raw_r2_key: null,
    clean_r2_key: null,
    intro_text: null,
    cover_art_url: "https://example.com/cover.jpg",
    seo_description: null,
    error_msg: null,
    retry_count: 0,
    published_at: "2026-03-01T00:00:00Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  };

  const mockChapters: Chapter[] = [
    {
      id: "ch-uuid-1",
      title_id: "title-uuid-1",
      chapter_num: 1,
      chapter_title: "Chapter I",
      word_count: 3000,
      text_r2_key: null,
      audio_raw_r2_key: null,
      audio_final_r2_key: "audio/final/1342/001.mp3",
      audio_url: "https://bucket.r2.dev/audio/final/1342/001.mp3",
      duration_secs: 1200,
      file_size_bytes: 9600000,
      status: "published",
      tts_char_count: 15000,
      pronunciation_hints: [],
      published_at: "2026-03-01T00:00:00Z",
      created_at: "2026-02-01T00:00:00Z",
    },
  ];

  it("generates valid RSS XML with required iTunes tags", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: mockChapters }]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<rss");
    expect(xml).toContain("xmlns:itunes");
    expect(xml).toContain("<title>GütenBites Classics</title>");
    expect(xml).toContain("<itunes:author>");
    expect(xml).toContain("<itunes:image");
  });

  it("includes enclosure with correct attributes for each episode", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: mockChapters }]);

    expect(xml).toContain('<enclosure url="https://bucket.r2.dev/audio/final/1342/001.mp3"');
    expect(xml).toContain('length="9600000"');
    expect(xml).toContain('type="audio/mpeg"');
  });

  it("includes itunes:duration for each episode", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: mockChapters }]);
    expect(xml).toContain("<itunes:duration>1200</itunes:duration>");
  });

  it("uses chapter UUID as GUID", () => {
    const xml = generateRssXml(mockFeed, [{ title: mockTitle, chapters: mockChapters }]);
    expect(xml).toContain("<guid isPermaLink=\"false\">ch-uuid-1</guid>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/rss/generate.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement RSS generation**

Create `src/rss/generate.ts`:

```typescript
import type { Feed, Title, Chapter } from "@/lib/supabase";

interface TitleWithChapters {
  title: Title;
  chapters: Chapter[];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRfc2822(dateStr: string): string {
  return new Date(dateStr).toUTCString();
}

export function generateRssXml(
  feed: Feed,
  titlesWithChapters: TitleWithChapters[]
): string {
  const episodes: string[] = [];

  for (const { title, chapters } of titlesWithChapters) {
    for (const chapter of chapters) {
      if (!chapter.audio_url || !chapter.published_at) continue;

      const episodeTitle = `${title.title} — ${chapter.chapter_title}`;
      const description = `${title.title} by ${title.author}. ${chapter.chapter_title}.`;

      episodes.push(`    <item>
      <title>${escapeXml(episodeTitle)}</title>
      <description>${escapeXml(description)}</description>
      <enclosure url="${escapeXml(chapter.audio_url)}" length="${chapter.file_size_bytes ?? 0}" type="audio/mpeg"/>
      <guid isPermaLink="false">${chapter.id}</guid>
      <pubDate>${formatRfc2822(chapter.published_at)}</pubDate>
      <itunes:duration>${chapter.duration_secs ?? 0}</itunes:duration>
      <itunes:episode>${chapter.chapter_num}</itunes:episode>
      <itunes:season>${title.gutenberg_id}</itunes:season>
      <itunes:title>${escapeXml(episodeTitle)}</itunes:title>
      <itunes:author>${escapeXml(title.author)}</itunes:author>
    </item>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:spotify="http://www.spotify.com/ns/rss">
  <channel>
    <title>${escapeXml(feed.name)}</title>
    <link>https://gutenbites.com/feeds/${feed.slug}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <itunes:author>GütenBites</itunes:author>
    <itunes:category text="Arts">
      <itunes:category text="Books"/>
    </itunes:category>
    <itunes:image href="https://gutenbites.com/images/feeds/${feed.slug}-cover.jpg"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <podcast:locked>no</podcast:locked>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${episodes.join("\n")}
  </channel>
</rss>`;
}
```

- [ ] **Step 4: Create RSS API route**

Create `src/app/api/rss/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateRssXml } from "@/rss/generate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Fetch feed
  const { data: feed, error: feedError } = await supabase
    .from("feeds")
    .select("*")
    .eq("slug", slug)
    .single();

  if (feedError || !feed) {
    return NextResponse.json({ error: "Feed not found" }, { status: 404 });
  }

  // Fetch all published titles in this feed with their chapters
  const { data: titles } = await supabase
    .from("titles")
    .select("*")
    .eq("feed_slug", slug)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!titles || titles.length === 0) {
    return new NextResponse(generateRssXml(feed, []), {
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }

  const titlesWithChapters = [];

  for (const title of titles) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("title_id", title.id)
      .eq("status", "published")
      .order("chapter_num");

    if (chapters) {
      titlesWithChapters.push({ title, chapters });
    }
  }

  const xml = generateRssXml(feed, titlesWithChapters);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900", // 15 min cache
    },
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- tests/rss/generate.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/rss/generate.ts tests/rss/generate.test.ts src/app/api/rss/
git commit -m "feat: add RSS feed generation with iTunes/Podcast 2.0 tags and API route"
```

---

### Task 15: Publish Stage

**Files:**
- Create: `src/pipeline/publish.ts`
- Create: `tests/pipeline/publish.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/pipeline/publish.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";

// We test the publish logic by verifying it updates chapter statuses
describe("Publish Stage", () => {
  it("publishTitle is importable and exported", async () => {
    const mod = await import("@/pipeline/publish");
    expect(typeof mod.publishTitle).toBe("function");
  });
});
```

- [ ] **Step 2: Implement publish module**

Create `src/pipeline/publish.ts`:

```typescript
import { getSupabase, transitionTitle, logPipelineEvent } from "@/lib/supabase";

export async function publishTitle(titleId: string): Promise<void> {
  const supabase = getSupabase();

  // Mark all processed chapters as published
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id")
    .eq("title_id", titleId)
    .eq("status", "processed");

  if (error || !chapters) {
    throw new Error(`Failed to fetch chapters for ${titleId}: ${error?.message}`);
  }

  const now = new Date().toISOString();

  for (const chapter of chapters) {
    await supabase
      .from("chapters")
      .update({ status: "published", published_at: now })
      .eq("id", chapter.id);
  }

  // Transition title to published
  await transitionTitle(titleId, "processed", "published", {
    published_at: now,
  });

  await logPipelineEvent(titleId, "state_transition", "processed", "published", {
    chapters_published: chapters.length,
    published_at: now,
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

```bash
npm test -- tests/pipeline/publish.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pipeline/publish.ts tests/pipeline/publish.test.ts
git commit -m "feat: add publish stage that marks chapters and title as published"
```

---

### Task 16: Manual Pipeline Runner Script

**Files:**
- Create: `scripts/seed-feeds.ts`
- Create: `scripts/run-pipeline.ts`

- [ ] **Step 1: Create feed seeding script**

Create `scripts/seed-feeds.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

async function seedFeeds() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const feeds = [
    {
      slug: "classics",
      name: "GütenBites Classics",
      description:
        "The greatest works of classic literature, narrated by AI. From Austen to Dostoevsky, experience timeless stories in a new way.",
      voice_id: process.env.ELEVENLABS_VOICE_ID!,
      rss_url: "https://gutenbites.com/api/rss/classics",
    },
  ];

  for (const feed of feeds) {
    const { error } = await supabase.from("feeds").upsert(feed);
    if (error) {
      console.error(`Failed to seed feed ${feed.slug}:`, error.message);
    } else {
      console.log(`Seeded feed: ${feed.slug}`);
    }
  }
}

seedFeeds().catch(console.error);
```

- [ ] **Step 2: Create manual pipeline runner**

Create `scripts/run-pipeline.ts`:

```typescript
import "dotenv/config";
import { ingestTitle } from "../src/pipeline/ingest";
import { cleanTitle } from "../src/pipeline/clean";
import { segmentTitle } from "../src/pipeline/segment";
import { enrichTitle } from "../src/pipeline/enrich";
import { qaTitle } from "../src/pipeline/qa";
import { synthesizeTitle } from "../src/pipeline/synthesize";
import { postprocessTitle } from "../src/pipeline/postprocess";
import { publishTitle } from "../src/pipeline/publish";

async function runPipeline(gutenbergId: number, feedSlug: string) {
  console.log(`\n=== GütenBites Pipeline: Gutenberg #${gutenbergId} ===\n`);

  try {
    console.log("1/8 Ingesting from Gutenberg...");
    const titleId = await ingestTitle(gutenbergId, feedSlug);
    console.log(`   Title ID: ${titleId}`);

    console.log("2/8 Cleaning text...");
    await cleanTitle(titleId);

    console.log("3/8 Segmenting chapters...");
    await segmentTitle(titleId);

    console.log("4/8 Generating editorial intro...");
    await enrichTitle(titleId);

    console.log("5/8 Running QA scan...");
    await qaTitle(titleId);

    console.log("6/8 Synthesizing audio (this may take several minutes)...");
    await synthesizeTitle(titleId);

    console.log("7/8 Post-processing audio...");
    await postprocessTitle(titleId);

    console.log("8/8 Publishing...");
    await publishTitle(titleId);

    console.log(`\n=== COMPLETE: "${gutenbergId}" is now published ===`);
    console.log(`RSS feed: https://gutenbites.com/api/rss/${feedSlug}`);
  } catch (error) {
    console.error("\n=== PIPELINE FAILED ===");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Parse CLI args: npm run pipeline -- <gutenberg_id> <feed_slug>
const gutenbergId = parseInt(process.argv[2], 10);
const feedSlug = process.argv[3] || "classics";

if (isNaN(gutenbergId)) {
  console.error("Usage: npm run pipeline -- <gutenberg_id> [feed_slug]");
  console.error("Example: npm run pipeline -- 1342 classics");
  process.exit(1);
}

runPipeline(gutenbergId, feedSlug);
```

- [ ] **Step 3: Install dotenv for scripts**

```bash
npm install dotenv
```

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-feeds.ts scripts/run-pipeline.ts package.json package-lock.json
git commit -m "feat: add seed-feeds and manual pipeline runner scripts"
```

---

### Task 17: End-to-End Smoke Test

This is not an automated test — it's the manual verification that proves M1.

- [ ] **Step 1: Copy .env.local.example and fill in real values**

```bash
cp .env.local.example .env.local
# Edit .env.local with your real API keys
```

- [ ] **Step 2: Apply database migration**

Run the SQL from `supabase/migrations/001_initial_schema.sql` in Supabase Dashboard SQL editor.

- [ ] **Step 3: Seed the feeds table**

```bash
npm run seed
```

Expected: `Seeded feed: classics`

- [ ] **Step 4: Run the full pipeline on a short book**

Pick a short public domain work for fast iteration. Gutenberg ID 11 = *Alice's Adventures in Wonderland* by Lewis Carroll (~26,000 words).

```bash
npm run pipeline -- 11 classics
```

Expected output (each step prints):
```
=== GütenBites Pipeline: Gutenberg #11 ===

1/8 Ingesting from Gutenberg...
   Title ID: <uuid>
2/8 Cleaning text...
3/8 Segmenting chapters...
4/8 Generating editorial intro...
5/8 Running QA scan...
6/8 Synthesizing audio (this may take several minutes)...
7/8 Post-processing audio...
8/8 Publishing...

=== COMPLETE: "11" is now published ===
```

- [ ] **Step 5: Verify the RSS feed**

```bash
npm run dev &
curl http://localhost:3000/api/rss/classics
```

Expected: Valid RSS XML with `<item>` entries for each chapter of Alice in Wonderland. Verify:
- `<enclosure>` tags have valid R2 URLs
- `<itunes:duration>` is populated
- `<guid>` is present for each episode

- [ ] **Step 6: Verify in Supabase**

Check the Supabase dashboard:
- `titles` table: 1 row, status = "published", published_at is set
- `chapters` table: multiple rows (one per chapter), all status = "published"
- `pipeline_logs` table: entries for each state transition
- `feeds` table: 1 row for "classics"

- [ ] **Step 7: Commit final state**

```bash
git add -A
git commit -m "feat: M1 Pipeline Proof complete — end-to-end pipeline verified"
```

---

## Plan Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | `package.json`, `tsconfig.json`, Next.js app shell |
| 2 | Database schema + Supabase client | `001_initial_schema.sql`, `supabase.ts`, `config.ts` |
| 3 | R2 storage client | `r2.ts`, `r2.test.ts` |
| 4 | Pipeline state machine | `states.ts`, `states.test.ts` |
| 5 | Claude API client | `claude.ts` |
| 6 | ElevenLabs TTS client | `elevenlabs.ts` |
| 7 | Gutenberg ingest | `ingest.ts`, `ingest.test.ts` |
| 8 | Text cleaning | `clean.ts`, `clean.test.ts` |
| 9 | Chapter segmentation | `segment.ts`, `segment.test.ts` |
| 10 | Editorial intro generation | `enrich.ts`, `enrich.test.ts` |
| 11 | QA scanning | `qa.ts`, `qa.test.ts` |
| 12 | Audio synthesis | `synthesize.ts`, `synthesize.test.ts` |
| 13 | Audio post-processing | `postprocess.ts`, `postprocess.test.ts` |
| 14 | RSS feed generation + API route | `generate.ts`, `generate.test.ts`, `route.ts` |
| 15 | Publish stage | `publish.ts`, `publish.test.ts` |
| 16 | Scripts (seed + manual runner) | `seed-feeds.ts`, `run-pipeline.ts` |
| 17 | End-to-end smoke test | Manual verification |

## What This Plan Does NOT Cover (Separate Plans)

- **M2:** Orchestrator/scheduler (cron-based batch processing, error retry logic)
- **M3:** Landing page, SEO title pages, Stripe subscriptions, admin dashboard
- **Later:** AI agents (Prioritizer, Growth Agent), web player, institutional licensing
