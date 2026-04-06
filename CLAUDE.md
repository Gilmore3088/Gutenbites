# GütenBites — Project Context

## What This Is
AI-narrated audiobook podcast platform. Converts Project Gutenberg public domain books into podcast episodes via an automated pipeline (Gutenberg -> Claude text processing -> ElevenLabs TTS -> ffmpeg -> Supabase -> RSS).

## Tech Stack
- Next.js 14 (App Router), TypeScript, Vitest
- Supabase (Postgres + Auth + Storage)
- ElevenLabs TTS, Anthropic Claude API, ffmpeg
- Deployed on Vercel with daily cron orchestrator

## Design Context

### Brand Personality
**Warm. Literary. Refined.** Not a tech product — a literary product that uses technology. The voice of a well-read friend who recommends books without pretension.

### Emotional Goal
Excitement + Nostalgia — "Classic literature feels alive again."

### Aesthetic Direction
Editorial warmth. Typography-driven. Penguin Classics meets Audible's immersive player.

**Theme:** Warm light — cream (#fdfaf5), ink (#1a1a18), gold (#c8860a)
**Fonts:** Fraunces (display), Source Serif 4 (body), DM Mono (labels)

### Anti-References
- No generic podcast app grids
- No AI/tech startup aesthetic (purple gradients, futuristic glow)
- No academic/institutional dryness
- No over-minimal prototypes

### Design Principles
1. **Content is the hero** — UI recedes, literature advances
2. **Warmth over sterility** — parchment tones, serif typography, natural textures
3. **Earned sophistication** — quality through craft details, not decoration
4. **Audio deserves its own mood** — the player is immersive and focused
5. **Every page is a landing page** — each page independently communicates value
