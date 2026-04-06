"use client";

import { useEffect, useState } from "react";

interface BookEntry {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  feed_slug: string;
  published_at: string | null;
  chapter_count?: number;
  total_duration?: number;
}

const FEED_LABELS: Record<string, string> = {
  classics: "Classics",
  "world-voices": "World Voices",
  "strange-gothic": "Strange & Gothic",
  "short-sharp": "Short & Sharp",
  "big-ideas": "Big Ideas",
  "hidden-gems": "Hidden Gems",
};

const FEED_COLORS: Record<string, string> = {
  classics: "#2c1810",
  "world-voices": "#1a3a2a",
  "strange-gothic": "#2a1a2e",
  "short-sharp": "#1a2a3a",
  "big-ideas": "#3a2a1a",
  "hidden-gems": "#1a3a3a",
};

const ALL_FEEDS = [
  "all",
  "classics",
  "world-voices",
  "strange-gothic",
  "short-sharp",
  "big-ideas",
  "hidden-gems",
] as const;

function formatRuntime(secs: number | undefined): string {
  if (!secs) return "";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function BrowsePage() {
  const [books, setBooks] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data.books ?? []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredBooks =
    activeFilter === "all"
      ? books
      : books.filter((b) => b.feed_slug === activeFilter);

  const presentFeeds = ALL_FEEDS.filter(
    (f) => f === "all" || books.some((b) => b.feed_slug === f)
  );

  return (
    <>
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

      <main className="browse-main">
        {/* HERO */}
        <div className="browse-hero">
          <div className="browse-hero-inner">
            <div className="browse-hero-eyebrow">Published Titles</div>
            <h1>Library</h1>
            <p className="browse-hero-sub">
              Browse our collection of AI-narrated classics
            </p>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="browse-filters">
          <div className="browse-filters-inner">
            {presentFeeds.map((f) => (
              <button
                key={f}
                className={`filter-tab ${activeFilter === f ? "filter-tab--active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f === "all" ? "All" : (FEED_LABELS[f] ?? f)}
              </button>
            ))}
          </div>
        </div>

        {/* BOOK GRID */}
        <div className="browse-grid-section">
          <div className="browse-grid-inner">
            {loading ? (
              <div
                style={{
                  padding: "5rem 0",
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  color: "var(--ink-muted)",
                }}
              >
                Loading...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="browse-empty">
                <p>Coming soon</p>
                <p>We&rsquo;re working on titles for this feed. Check back shortly.</p>
              </div>
            ) : (
              <div className="browse-grid">
                {filteredBooks.map((book) => {
                  const spineColor =
                    FEED_COLORS[book.feed_slug] ?? FEED_COLORS.classics;
                  const feedLabel =
                    FEED_LABELS[book.feed_slug] ?? book.feed_slug;
                  const runtime = formatRuntime(book.total_duration);
                  const chapCount = book.chapter_count;

                  return (
                    <a
                      key={book.id}
                      href={`/books/${book.gutenberg_id}`}
                      className="book-card"
                    >
                      <div
                        className="book-card-spine"
                        style={{ background: spineColor }}
                      />
                      <div className="book-card-body">
                        <span className="book-card-feed-badge">
                          {feedLabel}
                        </span>
                        <h3 className="book-card-title">{book.title}</h3>
                        <p className="book-card-author">{book.author}</p>
                        <div className="book-card-meta">
                          <span className="book-card-stats">
                            {chapCount != null && chapCount > 0
                              ? `${chapCount} ch${chapCount !== 1 ? "s" : ""}`
                              : ""}
                            {chapCount != null && chapCount > 0 && runtime
                              ? " \u00b7 "
                              : ""}
                            {runtime}
                          </span>
                          <span className="book-card-listen">
                            Listen
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
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
