# GütenBites — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Owner:** Founder  
**Domain:** gutenbites.com  
**Updated:** April 2026  

---

## Table of Contents

1. [Vision & Mission](#1-vision--mission)
2. [User Personas](#2-user-personas)
3. [Goals & OKRs](#3-goals--okrs)
4. [Scope](#4-scope)
5. [FR-01: Content Pipeline](#5-fr-01-content-pipeline)
6. [FR-02: Web Player & Consumer App](#6-fr-02-web-player--consumer-app)
7. [FR-03: Subscriptions & Payments](#7-fr-03-subscriptions--payments)
8. [FR-04: Admin Dashboard](#8-fr-04-admin-dashboard)
9. [FR-05: AI Agent Layer](#9-fr-05-ai-agent-layer)
10. [FR-06: SEO & Discovery](#10-fr-06-seo--discovery)
11. [FR-07: RSS & Platform Distribution](#11-fr-07-rss--platform-distribution)
12. [Data Model](#12-data-model)
13. [API Design](#13-api-design)
14. [Integrations](#14-integrations)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Security & Compliance](#16-security--compliance)
17. [Analytics Plan](#17-analytics-plan)
18. [MVP Definition](#18-mvp-definition)
19. [Milestones](#19-milestones)
20. [Open Questions](#20-open-questions)

---

## Overview

GütenBites converts the 70,000+ public domain books on Project Gutenberg into production-quality AI-narrated podcast episodes. The product is a **network of themed podcast feeds**, a **premium subscriber experience**, and a **fully automated content pipeline** — operated solo, scaled by AI agents, distributed globally via existing podcast infrastructure.

| Metric | Value |
|--------|-------|
| Source titles | 70,000+ |
| Content licensing cost | $0 |
| Cost per novel (TTS) | ~$18 |
| Global podcast listeners | 500M+ |
| Year 3 ARR target | $1.3M |

---

## 1. Vision & Mission

### Vision

The world's great literature, freely accessible to every person with ears — beautifully produced, expertly curated, and effortlessly discovered.

### Mission

GütenBites makes the public domain's intellectual wealth audible. We use AI narration and automated publishing to produce the largest curated classic audiobook podcast network, distributed free on every major platform and monetized through premium subscriptions, institutional licensing, and contextual sponsorships.

### Strategic Pillars

- **📡 Infinite Library** — 70,000+ perpetually free source texts. No licensing negotiations. No content budget. Every processed title permanently enriches the catalog.
- **🤖 AI-First Operations** — Claude agents handle prioritization, text enrichment, QA, and growth decisions. Human time is measured in minutes per week, not hours per day.
- **🌐 Open Distribution** — Podcast RSS is free, ubiquitous, and platform-agnostic. Content reaches Spotify, Apple, and Amazon without exclusivity or platform dependency.

### Product Principles

| Principle | What it means in practice |
|-----------|--------------------------|
| Automate before hiring | Every recurring task is a candidate for automation. Human labor is reserved for judgment, not execution. |
| Free tier is the product | The free experience must be genuinely excellent. Premium converts because the free tier proves value, not because it's crippled. |
| Catalog depth beats breadth | 500 impeccably produced titles beat 5,000 mediocre ones. Quality gates exist at every pipeline stage. |
| SEO is compounding equity | Every title page, feed, and episode is a permanent organic discovery asset. Paid acquisition is never the primary growth lever. |
| Build for the solo operator | All systems are designed to run without intervention. Alerts surface only when human judgment is genuinely required. |

---

## 2. User Personas

### Persona 1 — The Commuter
- **Profile:** 32, Marketing Manager
- Wants to "read more classics" but has no time
- Listens 45+ min/day during commute
- Discovers via Spotify / Apple podcasts
- Free tier primary; premium if hooked on a series
- Frustration: LibriVox audio quality is jarring

### Persona 2 — The Student
- **Profile:** 19, College English Major
- Assigned classics; needs to absorb them fast
- Listens while doing other tasks
- Discovers via Google ("free Great Gatsby audio")
- Needs study guides + chapter navigation
- Institutional access if school licenses it

### Persona 3 — The Educator
- **Profile:** 45, High School English Teacher
- Wants supplemental audio for classroom texts
- Needs consistent, school-appropriate quality
- Decision-maker for institutional license
- Values curriculum alignment + study materials
- Budget holder: $200–1,000/yr per school

### Persona 4 — The Enthusiast
- **Profile:** 58, Retired Librarian
- Deep love of literature; reads widely
- Appreciates editorial context and curation
- Most likely to subscribe premium
- Discovers via BookTok, literary newsletters
- Wants deeper catalog: niche, global, obscure titles

### Jobs to Be Done

| When I… | I want to… | So I can… | Persona |
|---------|-----------|-----------|---------|
| Have a 40-min commute | Listen to a great book | Make dead time feel enriching | Commuter |
| Have a class on Pride & Prejudice tomorrow | Absorb it tonight without reading every word | Participate confidently in discussion | Student |
| Want to assign a text supplement | Find reliable audio my students can access free | Improve comprehension without extra cost | Educator |
| Finish one Dickens novel | Get a recommendation for what to listen to next | Stay in a reading "mode" without decision fatigue | Enthusiast |
| Hear an unfamiliar author mentioned | Immediately find and start their most famous work | Explore without friction | All |

---

## 3. Goals & OKRs

### Year 1 OKRs

| Objective | Key Result | Target |
|-----------|-----------|--------|
| Establish catalog & pipeline | Titles published | 500 |
| Establish catalog & pipeline | Pipeline uptime (stages complete without human intervention) | ≥ 90% |
| Establish catalog & pipeline | Time to publish new title (queue → live) | ≤ 48 hrs |
| Build an audience | Monthly downloads | 150,000 |
| Build an audience | Unique monthly listeners | 25,000 |
| Build an audience | Episode completion rate (% listening >80%) | ≥ 40% |
| Prove monetization | Premium subscribers | 500 |
| Prove monetization | Monthly recurring revenue | $3,500 |
| Prove monetization | Podcast ad revenue | $2,500/mo |

### Year 2–3 Targets

| Metric | Year 2 | Year 3 |
|--------|--------|--------|
| Published titles | 5,000 | 15,000+ |
| Premium subscribers | 3,500 | 10,000 |
| Institutional licenses | 50 | 150 |
| ARR | ~$405K | ~$1.3M |

### North Star Metric

> **Monthly listening hours** — the single metric that captures audience engagement, catalog quality, and retention simultaneously. A growing listener who finishes books will convert to premium and stay subscribed.

---

## 4. Scope

### ✅ In Scope — MVP

- Gutenberg ingest + text pipeline
- ElevenLabs TTS synthesis
- ffmpeg post-processing
- RSS feed generation (6 feeds)
- Supabase state machine
- Landing page + email capture
- SEO title pages (static)
- Claude text cleaner + segmenter
- Admin pipeline dashboard
- Stripe premium subscription

### 🔜 In Scope — V2

- Mobile web player (PWA)
- Study guide PDF generation
- Institutional licensing portal
- Growth Agent + Prioritizer Agent
- Analytics feedback loop
- Reading-along transcript sync
- Curated playlist / curriculum builder
- Sponsorship ad insertion system

### 🔭 In Scope — V3

- Native iOS/Android app
- Multi-voice dramatized readings
- Non-English catalogs (FR, ES, DE)
- White-label API for publishers

### ❌ Out of Scope (All Versions)

- Copyrighted content outside the public domain
- Human narrator hiring pipeline
- Social features (comments, follows)
- User-generated content
- Video/visual format
- Podcast creation tools for third parties
- Real-time live audio

---

## 5. FR-01: Content Pipeline

> The content pipeline is the core product. All other features depend on its reliability. Pipeline uptime and throughput are the most critical engineering metrics.

### FR-01.1 — Source Ingestion `P0` `MVP`

- System MUST fetch texts from Project Gutenberg catalog API by numeric ID
- Format preference order: Standard Ebooks EPUB > Gutenberg EPUB > Gutenberg HTML > Gutenberg TXT
- Raw file MUST be stored to Cloudflare R2 before any processing begins
- Metadata extracted: title, author, language, subject tags, Gutenberg publication date
- Duplicate detection: system MUST reject re-ingestion of already-processed IDs
- Batch mode: scheduler MUST support queuing 1–100 titles per run via CSV or API

### FR-01.2 — Text Cleaning `P0` `MVP`

- MUST strip Gutenberg boilerplate header/footer (detected by known marker strings)
- MUST remove footnote markers: `[1]`, `*`, `[Footnote: ...]` patterns
- MUST normalize whitespace: collapse 3+ blank lines to 2, normalize line endings
- MUST remove page numbers in standard formats (standalone numbers, "Page 42", "- 42 -")
- SHOULD preserve: em-dashes, ellipses, quotation marks (smart or straight)
- MUST NOT alter dialogue, prose rhythm, or chapter content
- Output MUST be UTF-8 clean text with no binary artifacts

### FR-01.3 — Chapter Segmentation `P0` `MVP`

- MUST detect and extract individual chapters as discrete text units
- MUST handle variant heading formats: "Chapter I", "Chapter One", "CHAPTER 1", unnumbered section breaks
- Each chapter MUST be stored as a separate file in R2 with chapter number and title
- MUST handle edge cases: prologues, epilogues, author's notes, dedication pages (include as episodes)
- Minimum chapter length: 300 words. Chapters below threshold MUST be flagged for review or merged
- Maximum recommended chapter length: 8,000 words (~55 min audio). Longer chapters MAY be split at natural paragraph breaks
- Segmentation result MUST be stored as structured JSON: `[{num, title, word_count, r2_key}]`

### FR-01.4 — Editorial Enrichment `P1` `MVP`

- System MUST generate one editorial intro script per book (not per chapter)
- Intro MUST be 150–250 words (approx. 90 seconds at natural speaking pace)
- Intro MUST include: author biographical context, historical period, why this work matters, and a narrative hook
- Intro MUST NOT contain spoilers beyond what is common public knowledge
- Intro is reused verbatim at the start of every chapter episode of that book
- Intro script MUST be stored in Supabase `titles.intro_text`
- Human review of intro is OPTIONAL but flagged as "available for review" in admin

### FR-01.5 — TTS Quality Assurance `P1` `MVP`

- Claude QA agent MUST scan each chapter for TTS-problematic content before synthesis
- MUST flag: unusual proper nouns, foreign phrases, archaic abbreviations, Roman numerals in ambiguous context
- MUST output phonetic hints as ElevenLabs pronunciation dictionary entries
- MUST flag chapters with: word count anomalies (±3σ from book average), non-prose content (poetry, tables, diagrams)
- Flagged chapters MUST enter `qa_flagged` state and surface in admin dashboard for review before synthesis
- QA agent MUST run automatically; human review only triggered on flags

### FR-01.6 — Audio Synthesis `P0` `MVP`

- MUST use ElevenLabs Turbo v2 as primary TTS provider
- Text MUST be chunked at sentence boundaries, max 2,400 characters per API call
- MUST implement exponential backoff retry: 3 attempts, delays of 1s / 5s / 30s
- Each chunk MUST be stored in R2 before concatenation (enables resume on failure)
- Chunks MUST be concatenated in order to produce a single chapter MP3
- Voice ID MUST be configurable per feed (one voice per feed for brand consistency)
- MUST support parallel synthesis of up to 5 chapters concurrently (within EL rate limits)
- Cost tracking: MUST log character count per synthesis call to Supabase for billing monitoring

### FR-01.7 — Audio Post-Processing `P0` `MVP`

- MUST normalize loudness to -16 LUFS (podcast standard) using ffmpeg loudnorm filter
- MUST prepend branded intro music (configurable per feed, max 5 seconds with fade-in)
- MUST append branded outro music (configurable per feed, max 3 seconds with fade-out)
- MUST insert silence markers at 1/3 and 2/3 of episode duration for dynamic ad insertion
- MUST export as MP3, 128kbps, 44.1kHz stereo
- MUST calculate and store episode duration in seconds to Supabase
- SHOULD trim trailing silence from raw TTS output before muxing

### FR-01.8 — Pipeline State Machine `P0` `MVP`

Every title moves through a defined set of states. State transitions are atomic — a failure at any stage leaves the title at its last successful state.

```
queued → ingested → cleaned → segmented → enriched → qa_passed → synthesized → processed → published
```

Error states: `error_{stage_name}` — title held at error state until retry or manual resolution.

**State transition rules:**
- Orchestrator MUST run on a configurable schedule (default: every hour via cron)
- Each pipeline run MUST process a configurable batch size (default: 5 titles)
- MUST support manual state override from admin dashboard
- MUST log all state transitions with timestamp and metadata to Supabase

**Retry strategy:**

| Stage | Max Retries | Backoff |
|-------|-------------|---------|
| error_ingested | 5 | Exponential (1m, 5m, 1h, 6h, 24h) |
| error_cleaned | 3 | Exponential (1m, 5m, 1h) |
| error_synthesized | 5 | Exponential (1m, 5m, 1h, 6h, 24h) |
| error_published | 3 | Exponential (1m, 5m, 1h) |

> ⚠️ **ElevenLabs is the #1 failure point.** Always chunk at sentence boundaries and store raw chunks before concatenating so synthesis can resume from the last successful chunk.

---

## 6. FR-02: Web Player & Consumer App

### FR-02.1 — Public Landing Page `P0` `MVP`

- MUST have a homepage at gutenbites.com explaining the product and value proposition
- MUST display featured titles with cover art, author, and feed name
- MUST have prominent email capture for early access / newsletter
- MUST have direct links to podcast feeds on Spotify, Apple Podcasts, and Amazon Music
- MUST be fully responsive (mobile-first)
- MUST load in under 2 seconds on a 4G connection (Core Web Vitals: LCP < 2.5s)

### FR-02.2 — Title & Feed Pages (SEO) `P0` `MVP`

- Every published title MUST have a dedicated page at `/books/{slug}`
- Title page MUST include: cover art, title, author, year, summary (Claude-generated), episode list, feed subscription CTA
- Title page MUST include structured data (schema.org `Audiobook`, `PodcastSeries`)
- Each feed MUST have a page at `/feeds/{feed-slug}` listing all titles in that feed
- Pages MUST be statically generated (Next.js SSG or ISR with 24h revalidation)
- Every page MUST have canonical URL, meta title, meta description, and Open Graph tags

### FR-02.3 — Web Player (Premium) `P1` `V2`

- Authenticated premium subscribers MUST be able to play episodes directly in-browser
- Player MUST support: play/pause, seek, 15s skip back/forward, playback speed (0.75×, 1×, 1.25×, 1.5×, 2×)
- Player MUST persist playback position across sessions (resume where left off)
- Player SHOULD show synchronized transcript (text highlighted as audio plays)
- Player MUST be accessible: keyboard-navigable, ARIA labels on all controls
- Episodes MUST be available for offline download (PWA service worker)

---

## 7. FR-03: Subscriptions & Payments

### FR-03.1 — Premium Subscription (Consumer) `P0` `MVP`

- MUST offer monthly ($6.99) and annual ($59.99, ~29% discount) plans
- MUST use Stripe for payment processing; no card data stored on GütenBites infrastructure
- Premium benefits MUST include: ad-free episodes, offline downloads, study guide PDFs, early access to new series
- MUST send: welcome email, monthly listening summary, renewal reminder (7 days before)
- MUST support cancellation from user dashboard (no dark patterns; cancellation takes effect at period end)
- MUST support Stripe Customer Portal for self-service plan changes and billing updates
- Free tier MUST NOT require account creation to listen via podcast apps

### FR-03.2 — Institutional Licensing `P1` `V2`

Institutions (schools, libraries) purchase annual licenses covering multiple users.

| Tier | Users | Price/yr |
|------|-------|----------|
| Starter | Up to 50 | $299 |
| Standard | Up to 250 | $599 |
| District | Unlimited | $999 |

- MUST support invoice-based billing (purchase orders accepted)
- Institutional admin MUST be able to create/manage student accounts up to license limit
- MUST provide usage reports: listening hours, top titles, active users per institution
- MUST provide SSO compatibility (SAML/Google Workspace) for institutional accounts

---

## 8. FR-04: Admin Dashboard

### FR-04.1 — Pipeline Monitor `P0` `MVP`

- MUST show real-time pipeline status: count of titles at each state
- MUST show a filterable list of all titles with current status, last updated, and error message
- MUST allow manual state override (e.g., force `error_cleaned` → `ingested` for retry)
- MUST surface QA-flagged items for review with one-click approve/reject
- MUST show daily/weekly throughput chart (titles published per day)
- MUST send email alert when error queue exceeds 10 titles

### FR-04.2 — Catalog Management `P0` `MVP`

- MUST allow manual queue addition: enter Gutenberg ID(s) to queue, assign to feed
- MUST allow bulk CSV import of Gutenberg IDs
- MUST show catalog coverage by feed: title count, total episodes, total audio hours
- MUST allow editing of title metadata: cover art URL, description, feed assignment, priority score
- MUST allow pausing/unpausing individual titles from publishing

### FR-04.3 — Business Metrics `P1` `MVP`

- MUST show: MRR, subscriber count (free vs premium), monthly churn rate, LTV estimate
- MUST show: total downloads, downloads by feed, downloads by title (top 20)
- MUST show: monthly pipeline costs (ElevenLabs API spend, R2 storage, infra total)
- MUST show: cost per published episode, cost per 1,000 downloads (eCPM)

---

## 9. FR-05: AI Agent Layer

> These agents are scheduled processes that run autonomously and write structured decisions back to Supabase. They are the operational intelligence that makes the pipeline self-directing. All agent outputs are logged and auditable.

### FR-05.1 — Prioritizer Agent `P1` `V2`

- MUST run nightly; reads all `queued` titles + weekly analytics data
- MUST output a ranked list of titles with numeric priority scores (0.0–1.0) and reasoning
- Priority signals MUST include: download trends by category, feed coverage gaps, title popularity indicators, clustering (series/author)
- MUST write scores to `titles.priority_score`
- Orchestrator MUST process highest-score titles first within each pipeline run
- All prioritization decisions MUST be logged to `agent_logs` with prompt + response

### FR-05.2 — Growth Agent `P1` `V2`

- MUST run weekly; analyzes current catalog + analytics + SEO opportunity data
- MUST output a list of 30–50 Gutenberg IDs to add to the queue, with feed assignment and rationale
- Discovery strategies MUST include: cluster expansion, gap filling, SEO opportunity, curriculum alignment, editorial picks ("hidden gems")
- Output MUST be reviewed by founder before queue insertion (shown as "Agent proposals pending" in admin)
- MUST validate all proposed IDs against Gutenberg catalog before proposing

### FR-05.3 — QA Agent `P0` `MVP`

- See FR-01.5 for detailed QA requirements
- MUST maintain a global pronunciation dictionary in Supabase that accumulates approved hints across all titles
- New hints MUST be checked against existing dictionary before surfacing as new flags
- MUST auto-approve chapters with zero flags, zero anomalies, and word count within 1σ of book mean

---

## 10. FR-06: SEO & Discovery

### FR-06.1 — Automated Page Generation `P0` `MVP`

- Every published title MUST trigger generation of: a canonical title page, an episode list page, and author page (if 2+ titles by same author)
- Claude MUST generate for each title: SEO meta title (~60 chars), meta description (~155 chars), long-form summary (300–500 words), and 5 FAQ entries (schema.org FAQPage)
- All pages MUST be submitted to sitemap.xml within 1 hour of generation
- Sitemap MUST be split into index + per-feed sitemaps (max 50K URLs per file)
- Robots.txt MUST allow all crawlers; canonical tags MUST be present on all pages

### FR-06.2 — Structured Data `P1` `MVP`

- Title pages MUST include schema.org `Audiobook` markup
- Feed pages MUST include `PodcastSeries` markup
- Episode pages MUST include `PodcastEpisode` markup with duration, datePublished
- Homepage MUST include `Organization` and `WebSite` markup with `SearchAction`

---

## 11. FR-07: RSS & Platform Distribution

### FR-07.1 — RSS Feed Generation `P0` `MVP`

- MUST generate a valid Podcast 2.0 / iTunes-compatible RSS XML feed per themed feed (6 feeds at launch)
- RSS MUST include all required tags: `<title>`, `<description>`, `<itunes:category>`, `<itunes:author>`, `<itunes:image>`, `<language>`
- Each episode item MUST include: `<enclosure>` (MP3 URL, length, type), `<itunes:duration>`, `<itunes:episode>`, `<itunes:season>`, GUID
- RSS MUST update within 15 minutes of a new episode being published
- MUST support Spotify's podcast ad markers (`<spotify:ad_break>`) for dynamic insertion

### FR-07.2 — Platform Submission `P0` `MVP`

All 6 RSS feeds MUST be submitted to:
- Spotify for Podcasters
- Apple Podcasts Connect
- Amazon Music / Audible
- Google Podcasts (via RSS)
- Pocket Casts
- Overcast

Feed health MUST be monitored every 6 hours. MUST alert on: feed parse errors, missing enclosures, episode count mismatch between RSS and Supabase.

---

## 12. Data Model

### `titles` — One row per Gutenberg book

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Auto-generated primary key |
| gutenberg_id | INT UNIQUE | Gutenberg catalog number — deduplication key |
| title | TEXT | Display title |
| author | TEXT | Primary author, Last First format |
| language | TEXT DEFAULT 'en' | ISO 639-1 language code |
| feed_slug | TEXT FK→feeds | Which podcast feed this belongs to |
| status | TEXT | Pipeline state machine value |
| priority_score | FLOAT DEFAULT 0 | Agent-assigned 0.0–1.0; higher = process sooner |
| raw_r2_key | TEXT | R2 path to source EPUB/TXT |
| clean_r2_key | TEXT | R2 path to cleaned text file |
| intro_text | TEXT | Claude-written 90-second editorial intro script |
| cover_art_url | TEXT | URL to cover image |
| seo_description | TEXT | Claude-generated long-form page summary |
| error_msg | TEXT | Last error message if status starts with error_ |
| retry_count | INT DEFAULT 0 | Number of retry attempts at current stage |
| published_at | TIMESTAMPTZ | When first episode went live |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last modified timestamp |

### `chapters` — One row per podcast episode

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Episode identifier (used as GUID in RSS) |
| title_id | UUID FK→titles | Parent book |
| chapter_num | INT | Order within book (1-indexed) |
| chapter_title | TEXT | Display name (e.g., "Chapter I: The Arrival") |
| word_count | INT | Used for anomaly detection in QA |
| text_r2_key | TEXT | R2 path to cleaned chapter text |
| audio_raw_r2_key | TEXT | Raw ElevenLabs output (pre-post-processing) |
| audio_final_r2_key | TEXT | Final production MP3 (post-ffmpeg) |
| audio_url | TEXT | Public CDN URL used in RSS enclosure |
| duration_secs | INT | Episode length in seconds |
| file_size_bytes | BIGINT | Required for RSS `<enclosure length="">` |
| status | TEXT | pending / synthesized / processed / published / qa_flagged |
| tts_char_count | INT | Characters sent to ElevenLabs; used for cost tracking |
| pronunciation_hints | JSONB | Array of `{word, phonetic}` objects from QA agent |
| published_at | TIMESTAMPTZ | When episode went live in RSS |

### `feeds` — Podcast feed definitions

| Column | Type | Description |
|--------|------|-------------|
| slug | TEXT PK | URL-safe ID (e.g., "classics") |
| name | TEXT | Display name |
| description | TEXT | Feed description for RSS |
| voice_id | TEXT | ElevenLabs voice ID for this feed |
| intro_music_r2 | TEXT | R2 key for branded intro audio |
| rss_url | TEXT | Public RSS feed URL |

### `users` — Subscriber accounts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Supabase Auth user ID |
| email | TEXT | Primary identifier |
| stripe_customer_id | TEXT | Stripe customer reference |
| plan | TEXT | free / premium / institutional |
| institution_id | UUID FK | FK→institutions (if applicable) |
| created_at | TIMESTAMPTZ | Registration timestamp |

### `pipeline_logs` — Immutable audit log

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Log entry identifier |
| title_id | UUID FK | Associated title (nullable for agent-level logs) |
| event_type | TEXT | state_transition / agent_decision / error / retry |
| from_status | TEXT | Previous state |
| to_status | TEXT | New state |
| metadata | JSONB | Stage-specific data (cost, duration, agent prompt/response, error details) |
| created_at | TIMESTAMPTZ | Immutable event timestamp |

---

## 13. API Design

All authenticated endpoints require a valid Supabase JWT. Admin endpoints additionally require `role: admin` in JWT claims.

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feeds` | List all active podcast feeds with metadata |
| GET | `/api/feeds/{slug}/episodes` | Paginated episode list for a feed |
| GET | `/api/books/{slug}` | Title details + chapter list |
| GET | `/api/books/search?q={query}` | Full-text search across titles and authors |
| GET | `/rss/{feed-slug}.xml` | Live podcast RSS feed |

### Authenticated (User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Current user profile + subscription status |
| GET | `/api/user/progress` | Playback positions across all episodes |
| POST | `/api/user/progress/{chapter_id}` | Save playback position — body: `{position_secs}` |
| POST | `/api/checkout` | Create Stripe checkout session for subscription |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver (subscription lifecycle events) |

### Admin (role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/pipeline` | Pipeline status: counts by state, error queue |
| POST | `/api/admin/queue` | Add title(s) — body: `{gutenberg_ids[], feed_slug}` |
| PUT | `/api/admin/titles/{id}/status` | Manual state override |
| POST | `/api/admin/qa/{chapter_id}/approve` | Approve a QA-flagged chapter |
| GET | `/api/admin/metrics` | Business metrics: MRR, downloads, costs |
| GET | `/api/admin/agent-proposals` | Pending Growth Agent title proposals |
| POST | `/api/admin/agent-proposals/approve` | Accept Growth Agent proposals into queue |

---

## 14. Integrations

| Integration | Purpose | Auth | Key Constraints |
|-------------|---------|------|-----------------|
| Project Gutenberg API | Catalog metadata + file download | None (public) | Respect crawl delay (1 req/sec); prefer bulk mirror for mass downloads |
| Standard Ebooks | Higher-quality cleaned texts | None (public) | Covers ~600 texts; prefer over Gutenberg when available |
| ElevenLabs API | Text-to-speech synthesis | API Key | Rate limit varies by plan; character quota per month; monitor spend daily |
| Cloudflare R2 | Audio + text file storage (CDN) | Access Key + Secret | $0.015/GB storage; free egress via Workers; use custom domain for audio URLs |
| Supabase | Database + Auth + Realtime | Service Role Key (server); Anon Key (client) | Row-level security on all user-facing tables; backups enabled |
| Stripe | Subscriptions + payments | Secret Key + Webhook Secret | Use Stripe's hosted checkout; never handle raw card data |
| Anthropic Claude API | Text cleaning, segmentation, enrichment, agents | API Key | Haiku for mechanical tasks; Sonnet for creative/agent tasks; log all usage |
| Buzzsprout | Podcast hosting + analytics (MVP) | API Token | Upload via API; retrieve download stats via API; migrate off at 5K+ episodes |
| Vercel | Next.js hosting + edge functions | Deploy token | Free tier viable until 100K req/day; ISR for static pages |
| Resend / Postmark | Transactional email | API Key | Welcome, receipt, renewal, digest emails |

---

## 15. Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Web LCP | < 2.5 seconds | Core Web Vitals |
| Web CLS | < 0.1 | Core Web Vitals |
| Audio CDN latency (TTFB) | < 200ms globally | Cloudflare R2 + Workers |
| RSS feed response time | < 500ms | Uptime monitor |
| Admin dashboard load | < 3 seconds | Lighthouse (authenticated) |
| Pipeline: time-to-publish | < 48 hours | `published_at - created_at` |

### Reliability

| Component | Uptime Target | Notes |
|-----------|--------------|-------|
| RSS feeds | 99.9% | Platform re-pulls every 15–60 min; downtime = episode delay, not data loss |
| Audio CDN | 99.9% | Cloudflare R2 SLA |
| Web / marketing site | 99.5% | Vercel SLA; static pages resilient to API failures |
| Pipeline orchestrator | Best effort | Missed cron runs = delayed publishing; no listener impact |

### Scalability

The system MUST support growth from 50 to 50,000 published titles without architectural change:

- All audio files served from CDN (R2), never from application server
- RSS feeds generated and cached; not dynamically rendered per request
- Supabase queries always indexed on `status` and `priority_score`
- Pipeline workers are stateless and horizontally scalable
- Next.js pages use ISR — scale to millions of pages without build time impact

---

## 16. Security & Compliance

### Authentication

- Supabase Auth for all user accounts
- Magic link + Google OAuth at launch
- Admin role enforced via JWT custom claims
- All API keys stored in environment variables; never in code or Supabase
- Stripe webhooks validated by signature verification (not just presence)

### Data Privacy

- Privacy Policy and Terms of Service required before launch
- Email addresses: collected only with explicit opt-in
- Analytics: privacy-safe (Plausible or Fathom preferred over GA)
- GDPR: right to deletion via account settings (deletes user row + cascade)
- Payment data: never stored on GütenBites infrastructure (Stripe handles all PCI scope)

### Content & Copyright

> ✅ All source content is public domain. Project Gutenberg's texts are copyright-expired (pre-1928 in the US, or explicitly donated). GütenBites holds copyright on its AI-generated narration and original editorial content (intros, descriptions).

- MUST verify each title's public domain status before publishing
- MUST NOT process any Gutenberg text tagged with copyright restrictions
- AI-narrated audio ownership must be confirmed with ElevenLabs commercial terms
- DMCA contact address MUST be listed in site footer

### API Security

- Rate limiting on all public endpoints (100 req/min per IP)
- Admin endpoints behind Supabase RLS + JWT role check
- Pipeline server not publicly accessible (Hetzner private network)

---

## 17. Analytics Plan

### Key Metrics to Track

| Category | Metric | Source | Frequency |
|----------|--------|--------|-----------|
| Pipeline | Titles published, error rate, avg time-to-publish | Supabase | Daily |
| Pipeline | ElevenLabs API spend, cost per episode, cost per minute | Supabase pipeline_logs | Daily |
| Audience | Total downloads, unique listeners, downloads/episode | Buzzsprout API | Weekly |
| Audience | Episode completion rate (% finishing >80%) | Buzzsprout | Weekly |
| Audience | Top performing titles, feeds, authors | Buzzsprout | Weekly |
| Revenue | MRR, new subs, churn, net revenue retention | Stripe + Supabase | Weekly |
| Revenue | Free-to-paid conversion rate by traffic source | Stripe + Plausible | Monthly |
| SEO | Organic impressions, clicks, CTR by page | Google Search Console | Weekly |
| SEO | Top landing pages, bounce rate | Plausible | Weekly |

### Analytics → Pipeline Feedback Loop

Analytics data feeds back into the Prioritizer Agent. Weekly analytics are written to a `weekly_analytics_snapshot` table and passed as context to the Prioritizer Agent's nightly run — creating a closed loop between what listeners consume and what the pipeline produces next.

**Minimum analytics stack for MVP:** Buzzsprout (free), Google Search Console (free), Plausible ($9/mo), Stripe dashboard. Full custom analytics dashboard in admin by V2.

---

## 18. MVP Definition

> **MVP is done when:** 50 titles are live and listenable on Spotify and Apple Podcasts with no human intervention required to keep the pipeline running for new titles.

### MVP Checklist

| Item | Description |
|------|-------------|
| ☐ Pipeline complete | All stages (ingest → publish) wired and tested on 10 titles end-to-end |
| ☐ State machine | Supabase schema live; orchestrator running on cron; status dashboard accessible |
| ☐ 6 feeds live | RSS feeds generated, submitted to Spotify + Apple, and verifiably pulling new episodes |
| ☐ 50 titles published | First batch across all 6 feeds; cover art, metadata, descriptions all present |
| ☐ Landing page | gutenbites.com live with hero, featured titles, podcast app links, email capture |
| ☐ SEO pages | Title pages generated and indexed for all 50 titles; sitemap submitted to GSC |
| ☐ Admin dashboard | Pipeline monitor, QA review, and catalog management accessible |
| ☐ Stripe subscriptions | Premium subscription checkout live; webhook handling verified |
| ☐ Error alerting | Email alert when error queue > 10 or feed health check fails |
| ☐ Privacy + Terms | Privacy policy and terms of service published at /legal |

**Explicitly NOT required for MVP:** Mobile app · Study guide PDFs · Institutional licensing · Growth Agent · Prioritizer Agent · Web player · Analytics dashboard · Social sharing features.

---

## 19. Milestones

| Milestone | Target | Success Criteria | Phase |
|-----------|--------|-----------------|-------|
| M1 — Pipeline Proof | Week 2 | 1 title, end-to-end, live on Spotify | MVP |
| M2 — Pipeline Automated | Week 4 | Orchestrator running; 10 titles published without manual steps | MVP |
| M3 — MVP Launch | Month 2 | 50 titles, 6 feeds, landing page, Stripe subscriptions live | MVP |
| M4 — SEO Foundation | Month 3 | 200 title pages indexed; >5K organic monthly visitors | MVP |
| M5 — First Revenue | Month 4 | 10 paying subscribers; first Buzzsprout ad payout | MVP |
| M6 — 500 Titles | Month 8 | 500 published titles; pipeline <48hr avg time-to-publish | V2 |
| M7 — Premium Experience | Month 9 | Web player live; study guides for top 50 titles; PWA installable | V2 |
| M8 — Self-Growing Pipeline | Month 10 | Growth Agent + Prioritizer running; catalog expanding 50+ titles/week automatically | V2 |
| M9 — Institutional Launch | Month 12 | 5 institutional contracts signed; licensing portal live | V2 |
| M10 — Year 1 Close | Month 12 | 500 premium subs; $3,500 MRR; 150K monthly downloads | V2 |

---

## 20. Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| OQ-1 | Does ElevenLabs commercial license permit GütenBites to sell subscriptions and run ads on AI-narrated content? Need to verify enterprise tier terms. | 🔴 **Blocker** | Open |
| OQ-2 | Kokoro (open-source TTS) vs ElevenLabs at scale: at what monthly character volume does self-hosted Kokoro break even against EL costs? | 🟡 Medium | Open |
| OQ-3 | Should feeds be submitted to Spotify's "Audiobooks" section or the standard Podcasts section? Different editorial placement implications. | 🟡 Medium | Open |
| OQ-4 | Cover art strategy: AI-generated per title vs. public domain period illustrations vs. single consistent branded template? | 🟡 Medium | Open |
| OQ-5 | At what subscriber count does migrating from Buzzsprout to self-hosted RSS (R2 + Next.js) make economic sense? | 🟢 Low | Open |
| OQ-6 | Non-English public domain — is there a Gutenberg equivalent for French, Spanish, German texts? (Wikisource, BNF Gallica?) | 🟢 Low | Open |
| OQ-7 | What is the right business structure to avoid conflict with current employment given the B2B (institutional) revenue path? | 🔴 **Blocker** | Open — resolve before institutional outreach |

> 🔴 **OQ-1 and OQ-7 are hard blockers** before commercial launch. ElevenLabs commercial rights must be confirmed before any ad or subscription revenue is collected. Employment conflict review must be completed before any institutional sales outreach begins.

---

*GütenBites · gutenbites.com · PRD v1.0 · April 2026 · Confidential*
