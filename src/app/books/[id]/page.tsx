"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Chapter {
  id: string;
  chapter_num: number;
  chapter_title: string;
  word_count: number;
  audio_url: string | null;
  duration_secs: number | null;
  published_at: string | null;
}

interface Book {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  feed_slug: string;
  feed_name: string;
  intro_text: string | null;
  published_at: string | null;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(secs: number | null): string {
  if (secs == null) return "\u2014";
  return formatTime(secs);
}

function totalRuntime(chapters: Chapter[]): string {
  const total = chapters.reduce((sum, c) => sum + (c.duration_secs ?? 0), 0);
  if (total === 0) return "\u2014";
  return formatTime(total);
}

export default function BookPage() {
  const params = useParams();
  const id = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const [currentChapterIdx, setCurrentChapterIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Book not found");
        return res.json();
      })
      .then((data) => {
        setBook(data.book);
        setChapters(data.chapters);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const playChapter = useCallback(
    (idx: number) => {
      const chapter = chapters[idx];
      if (!chapter?.audio_url) return;

      if (audioRef.current) {
        audioRef.current.src = chapter.audio_url;
        audioRef.current.playbackRate = speed;
        audioRef.current.play().catch(() => {});
      }
      setCurrentChapterIdx(idx);
      setIsPlaying(true);
    },
    [chapters, speed]
  );

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (currentChapterIdx === null && chapters.length > 0) {
      playChapter(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, currentChapterIdx, chapters, playChapter]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSkip = useCallback((secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(audioRef.current.currentTime + secs, audioRef.current.duration || 0)
    );
  }, []);

  const handleSpeedChange = useCallback(() => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }, [speed]);

  const handleEnded = useCallback(() => {
    if (currentChapterIdx === null) return;
    const nextIdx = currentChapterIdx + 1;
    if (nextIdx < chapters.length) {
      playChapter(nextIdx);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentChapterIdx, chapters, playChapter]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const currentChapter =
    currentChapterIdx !== null ? chapters[currentChapterIdx] : null;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          letterSpacing: "0.1em",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !book) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
          fontFamily: "var(--font-body)",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            {error ?? "Book not found"}
          </p>
          <a href="/browse" className="btn-primary">
            Browse Library
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : "scrolled"}`}>
        <div className="nav-inner">
          <a href="/" className="nav-brand">
            G{"ü"}ten<span>Bites</span>
          </a>
          <ul className="nav-links">
            <li>
              <a href="/#feeds">Feeds</a>
            </li>
            <li>
              <a href="/#how-it-works">How it works</a>
            </li>
            <li>
              <a href="/browse" aria-current="page">
                Listen
              </a>
            </li>
            <li>
              <a href="/#subscribe" className="nav-cta">
                Get Early Access
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="book-detail-main">
        {/* BOOK HEADER */}
        <section className="book-header-section">
          <div className="book-header-inner">
            <div className="book-header-cover">
              <div className="book-cover-art">
                <div className="book-cover-spine" />
                <div className="book-cover-title">{book.title}</div>
                <div className="book-cover-author">{book.author}</div>
              </div>
            </div>

            <div className="book-header-info">
              <div className="book-feed-badge">{book.feed_name}</div>
              <h1 className="book-title">{book.title}</h1>
              <p className="book-author">{book.author}</p>

              {book.intro_text && (
                <p className="book-intro">{book.intro_text}</p>
              )}

              <div className="book-meta-row">
                <div className="book-meta-item">
                  <span className="book-meta-value">{chapters.length}</span>
                  <span className="book-meta-label">Chapters</span>
                </div>
                <div className="book-meta-item">
                  <span className="book-meta-value">
                    {totalRuntime(chapters)}
                  </span>
                  <span className="book-meta-label">Total Runtime</span>
                </div>
              </div>

              {chapters.length > 0 && chapters[0].audio_url && (
                <button
                  className="btn-primary"
                  onClick={() => playChapter(0)}
                  style={{ marginTop: "0.5rem" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play from Beginning
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CHAPTER LIST */}
        <section className="chapter-list-section">
          <div className="chapter-list-inner">
            <h2 className="chapter-list-heading">Chapters</h2>

            {chapters.length === 0 ? (
              <div className="book-empty-state">
                <p>No chapters available yet. This book is still being processed.</p>
              </div>
            ) : (
              <ol className="chapter-list" role="list" aria-label="Chapters">
                {chapters.map((chapter, idx) => {
                  const isActive = currentChapterIdx === idx;
                  return (
                    <li key={chapter.id}>
                      <button
                        className={`chapter-row ${isActive ? "chapter-row--active" : ""}`}
                        onClick={() => playChapter(idx)}
                        disabled={!chapter.audio_url}
                      >
                        <div className="chapter-row-left">
                          <span className="chapter-num">
                            {isActive && isPlaying ? (
                              <span className="chapter-playing-indicator" />
                            ) : (
                              String(chapter.chapter_num).padStart(2, "0")
                            )}
                          </span>
                          <span className="chapter-title-text">
                            {chapter.chapter_title || `Chapter ${chapter.chapter_num}`}
                          </span>
                        </div>
                        <span className="chapter-duration">
                          {formatDuration(chapter.duration_secs)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </main>

      {/* AUDIO PLAYER */}
      {currentChapter && (
        <div className="audio-player">
          <div className="audio-player-inner">
            <div className="audio-player-info">
              <span className="audio-player-chapter-label">Now Playing</span>
              <span className="audio-player-chapter-title">
                {currentChapter.chapter_title ||
                  `Chapter ${currentChapter.chapter_num}`}
              </span>
            </div>

            <div className="audio-player-controls">
              <button
                className="audio-ctrl-btn"
                onClick={() => handleSkip(-15)}
                title="Skip back 15s"
                aria-label="Skip back 15 seconds"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  <text x="7" y="15" fontSize="5" fill="currentColor" fontFamily="sans-serif">15</text>
                </svg>
              </button>

              <button
                className="audio-play-btn"
                onClick={handlePlayPause}
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                className="audio-ctrl-btn"
                onClick={() => handleSkip(15)}
                title="Skip forward 15s"
                aria-label="Skip forward 15 seconds"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                  <text x="13" y="15" fontSize="5" fill="currentColor" fontFamily="sans-serif">15</text>
                </svg>
              </button>
            </div>

            <div className="audio-player-progress">
              <span className="audio-time">{formatTime(currentTime)}</span>
              <input
                type="range"
                className="audio-scrubber"
                min={0}
                max={duration || 0}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
              />
              <span className="audio-time">{formatTime(duration)}</span>
            </div>

            <button
              className="audio-speed-btn"
              onClick={handleSpeedChange}
              title="Change playback speed"
              aria-label={`Playback speed ${speed}x`}
            >
              {speed}x
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="footer" style={{ paddingBottom: currentChapter ? "6rem" : undefined }}>
        <div className="footer-inner">
          <div>
            <div className="footer-brand">G{"ü"}tenBites</div>
            <p className="footer-tagline">
              The world&rsquo;s great literature, freely accessible to every
              person with ears.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="/#feeds">Feeds</a>
                </li>
                <li>
                  <a href="/browse">Browse Books</a>
                </li>
                <li>
                  <a href="#">Premium</a>
                </li>
                <li>
                  <a href="/admin">Admin</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms</a>
                </li>
                <li>
                  <a href="#">DMCA</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            &copy; 2026 G{"ü"}tenBites. All content from the public domain.
          </span>
          <span>Made with Claude &amp; good taste.</span>
        </div>
      </footer>
    </>
  );
}
