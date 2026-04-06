import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import Link from "next/link";

export const revalidate = 300;

interface Title {
  id: string;
  gutenberg_id: number;
  title: string;
  author: string;
  feed_slug: string;
  published_at: string | null;
}

const FEED_LABELS: Record<string, string> = {
  classics: "Classics",
  "world-voices": "World Voices",
  "strange-gothic": "Strange & Gothic",
  "short-sharp": "Short & Sharp",
  "big-ideas": "Big Ideas",
  "hidden-gems": "Hidden Gems",
};

export default async function BrowsePage() {
  let titles: Title[] = [];

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("titles")
      .select("id, gutenberg_id, title, author, feed_slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    titles = data ?? [];
  }

  return (
    <>
      <nav className="nav scrolled">
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
              <a href="/browse" aria-current="page">Listen</a>
            </li>
            <li>
              <a href="/#subscribe" className="nav-cta">
                Get Early Access
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main style={{ paddingTop: "80px", minHeight: "calc(100vh - 200px)" }}>
        <section className="section">
          <div className="section-header">
            <div className="section-eyebrow">Published Titles</div>
            <h2>
              Browse the <em>library</em>
            </h2>
          </div>

          {titles.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: "var(--ink-muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              <p
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  color: "var(--ink-secondary)",
                }}
              >
                Coming soon
              </p>
              <p>
                We&rsquo;re working on our first titles. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="feeds-grid">
              {titles.map((title) => (
                <div
                  key={title.id}
                  className="feed-card"
                  style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--gold)",
                      fontWeight: 500,
                    }}
                  >
                    {FEED_LABELS[title.feed_slug] ?? title.feed_slug}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      lineHeight: 1.3,
                    }}
                  >
                    {title.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      color: "var(--ink-secondary)",
                      flex: 1,
                    }}
                  >
                    {title.author}
                  </p>
                  <a
                    href={`/api/rss/${title.feed_slug}`}
                    target="_blank"
                    rel="noopener"
                    className="btn-primary"
                    style={{
                      marginTop: "0.75rem",
                      fontSize: "0.85rem",
                      padding: "0.5rem 1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      width: "fit-content",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Listen
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

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
          <span>&copy; 2026 G{"ü"}tenBites. All content from the public domain.</span>
          <span>Made with Claude &amp; good taste.</span>
        </div>
      </footer>
    </>
  );
}
