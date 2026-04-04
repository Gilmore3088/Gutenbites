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
