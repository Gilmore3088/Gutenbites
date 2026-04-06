"use client";

import { useEffect, useState } from "react";

const WAVE_BARS = [
  { h: "18px", delay: "0s" },
  { h: "28px", delay: "0.15s" },
  { h: "14px", delay: "0.3s" },
  { h: "32px", delay: "0.1s" },
  { h: "22px", delay: "0.25s" },
  { h: "36px", delay: "0.05s" },
  { h: "16px", delay: "0.35s" },
  { h: "26px", delay: "0.2s" },
  { h: "20px", delay: "0.12s" },
  { h: "30px", delay: "0.28s" },
  { h: "12px", delay: "0.08s" },
  { h: "24px", delay: "0.22s" },
];

const FEEDS = [
  {
    icon: "\u{1F3DB}",
    name: "Classics",
    slug: "classics",
    description:
      "The Western canon essentials. Austen, Dickens, Dostoevsky, Twain, and the Bront\u00ebs.",
    count: "50+ titles",
  },
  {
    icon: "\u{1F30D}",
    name: "World Voices",
    slug: "world-voices",
    description:
      "Translated masterworks from Tolstoy, Dumas, Hugo, Verne, and beyond the Anglophone tradition.",
    count: "30+ titles",
  },
  {
    icon: "\u{1F52E}",
    name: "Strange & Gothic",
    slug: "strange-gothic",
    description:
      "Shelley, Stoker, Poe, Lovecraft, and the uncanny corners of the literary imagination.",
    count: "25+ titles",
  },
  {
    icon: "\u{1F4D6}",
    name: "Short & Sharp",
    slug: "short-sharp",
    description:
      "Novellas and collections you can finish in a single commute. Kafka, Chekhov, Wilde.",
    count: "40+ titles",
  },
  {
    icon: "\u{1F52D}",
    name: "Big Ideas",
    slug: "big-ideas",
    description:
      "Philosophy, essays, and foundational texts. Plato, Thoreau, Wollstonecraft, Montaigne.",
    count: "20+ titles",
  },
  {
    icon: "\u{1F33F}",
    name: "Hidden Gems",
    slug: "hidden-gems",
    description:
      "Overlooked and underappreciated works curated by our editorial AI. Expect surprises.",
    count: "Coming soon",
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="/" className="nav-brand">
            G{"ü"}ten<span>Bites</span>
          </a>
          <ul className="nav-links">
            <li>
              <a href="#feeds">Feeds</a>
            </li>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <a href="/browse">Listen</a>
            </li>
            <li>
              <a href="#subscribe" className="nav-cta">
                Get Early Access
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow animate-up">
              Free on every podcast app
            </div>
            <h1 className="animate-up delay-1">
              The world&rsquo;s great literature,
              <br />
              <em>read to you.</em>
            </h1>
            <p className="hero-sub animate-up delay-2">
              We turn 70,000+ public domain classics into beautifully narrated
              podcast episodes. Free. On Spotify, Apple, and everywhere you
              listen.
            </p>
            <div className="hero-actions animate-up delay-3">
              <a href="#listen" className="btn-primary">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Listening
              </a>
              <a href="#how-it-works" className="btn-secondary">
                How it works &rarr;
              </a>
            </div>
          </div>

          <div className="hero-visual animate-fade delay-4">
            <div className="book-stack">
              <div className="book book-1">
                <div className="book-spine" />
                <div className="book-title">Pride &amp; Prejudice</div>
              </div>
              <div className="book book-2">
                <div className="book-spine" />
                <div className="book-title">The Great Gatsby</div>
              </div>
              <div className="book book-3">
                <div className="book-spine" />
                <div className="book-title">
                  Alice in
                  <br />
                  Wonderland
                </div>
              </div>

              <div className="waveform">
                {WAVE_BARS.map((bar, i) => (
                  <div
                    key={i}
                    className="wave-bar"
                    style={
                      {
                        "--h": bar.h,
                        animationDelay: bar.delay,
                        height: "8px",
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats animate-up delay-5">
          <div className="stat">
            <div className="stat-value">70,000+</div>
            <div className="stat-label">Source Titles</div>
          </div>
          <div className="stat">
            <div className="stat-value">$0</div>
            <div className="stat-label">Cost to Listen</div>
          </div>
          <div className="stat">
            <div className="stat-value">~$18</div>
            <div className="stat-label">Cost per Novel</div>
          </div>
          <div className="stat">
            <div className="stat-value">6</div>
            <div className="stat-label">Themed Feeds</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-it-works" id="how-it-works">
        <div className="section-header">
          <div className="section-eyebrow">How it works</div>
          <h2>
            From dusty archive to <em>your earbuds</em>
          </h2>
        </div>

        <div className="steps-grid">
          <div className="step">
            <div className="step-number">01</div>
            <h3>We find the text</h3>
            <p>
              Our pipeline pulls from Project Gutenberg&rsquo;s 70,000+ public
              domain works. No licensing costs. No copyright worries. Just
              humanity&rsquo;s literary heritage, waiting to be heard.
            </p>
          </div>
          <div className="step">
            <div className="step-number">02</div>
            <h3>AI brings it to life</h3>
            <p>
              Each text is cleaned, segmented into chapters, and narrated using
              studio-quality AI voices. We add editorial intros for context and
              normalize everything to broadcast standards.
            </p>
          </div>
          <div className="step">
            <div className="step-number">03</div>
            <h3>You press play</h3>
            <p>
              Episodes appear in your favorite podcast app. Subscribe to a
              themed feed, and new classics arrive automatically. Listen on
              your commute, at the gym, or while falling asleep.
            </p>
          </div>
        </div>
      </section>

      {/* FEEDS */}
      <section className="section" id="feeds">
        <div className="section-header">
          <div className="section-eyebrow">Podcast Feeds</div>
          <h2>
            Six feeds. <em>One subscription.</em>
          </h2>
        </div>

        <div className="feeds-grid">
          {FEEDS.map((feed) => (
            <a href={`/api/rss/${feed.slug}`} className="feed-card" key={feed.name} target="_blank" rel="noopener">
              <span className="feed-icon">{feed.icon}</span>
              <h3>{feed.name}</h3>
              <p>{feed.description}</p>
              <div className="feed-meta">{feed.count}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FEATURED TITLE */}
      <section className="section featured">
        <div className="section-header">
          <div className="section-eyebrow">Now Playing</div>
          <h2>
            Featured: <em>A Modest Proposal</em>
          </h2>
        </div>

        <div className="featured-content">
          <div className="featured-cover">
            <div className="featured-cover-title">
              A Modest Proposal
            </div>
            <div className="featured-cover-author">Jonathan Swift</div>
          </div>

          <div className="featured-details">
            <h3>A Modest Proposal</h3>
            <div className="featured-author">Jonathan Swift &middot; 1729</div>
            <p className="featured-description">
              Swift&rsquo;s razor-sharp satirical essay proposes a shocking solution
              to Irish poverty that skewers English colonial indifference with devastating wit.
              One of the most brilliantly savage pieces of political satire ever written.
            </p>

            <div className="featured-meta-row">
              <div className="featured-meta-item">
                <div className="featured-meta-value">1</div>
                <div className="featured-meta-label">Chapters</div>
              </div>
              <div className="featured-meta-item">
                <div className="featured-meta-value">22m</div>
                <div className="featured-meta-label">Total Runtime</div>
              </div>
              <div className="featured-meta-item">
                <div className="featured-meta-value">Big Ideas</div>
                <div className="featured-meta-label">Feed</div>
              </div>
            </div>

            <a
              href="https://ipijakdbonxvgvlxbzfv.supabase.co/storage/v1/object/public/gutenbites/audio/final/1080/001.mp3"
              className="btn-primary"
              style={{ background: "var(--gold)" }}
              target="_blank"
              rel="noopener"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Listen on Spotify
            </a>
          </div>
        </div>
      </section>

      {/* LISTEN ON */}
      <section className="section" id="listen">
        <div className="section-header" style={{ textAlign: "center" }}>
          <div
            className="section-eyebrow"
            style={{ justifyContent: "center" }}
          >
            Available Everywhere
          </div>
          <h2 style={{ margin: "0 auto", maxWidth: "500px" }}>
            Listen on <em>your favorite app</em>
          </h2>
        </div>

        <div className="platforms-row">
          {[
            { icon: "\u{1F3B5}", label: "Listen on", name: "Spotify" },
            { icon: "\u{1F34E}", label: "Listen on", name: "Apple Podcasts" },
            { icon: "\u{1F4E6}", label: "Listen on", name: "Amazon Music" },
            { icon: "\u{1F3A7}", label: "Listen on", name: "Pocket Casts" },
            { icon: "\u{1F50A}", label: "Listen on", name: "Overcast" },
          ].map((p) => (
            <a href="#" className="platform-badge" key={p.name}>
              <span className="platform-icon">{p.icon}</span>
              <span className="platform-text">
                <span className="platform-label">{p.label}</span>
                <span className="platform-name">{p.name}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="section email-section" id="subscribe">
        <div className="section-header">
          <div className="section-eyebrow">Early Access</div>
          <h2>
            Get notified when we <em>launch</em>
          </h2>
        </div>

        <form className="email-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            className="email-input"
            placeholder="your@email.com"
            required
          />
          <button type="submit" className="btn-primary">
            Notify Me
          </button>
        </form>
        <p className="email-note">
          No spam. Unsubscribe anytime. We&rsquo;ll email once when we go live.
        </p>
      </section>

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
                  <a href="#feeds">Feeds</a>
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
          <span>&copy; 2026 G{"ü"}tenBites. All content from the public domain.</span>
          <span>Made with Claude &amp; good taste.</span>
        </div>
      </footer>
    </>
  );
}
