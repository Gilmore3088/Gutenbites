"use client";

import { useState } from "react";

const FEED_OPTIONS = [
  { value: "classics", label: "Classics" },
  { value: "world-voices", label: "World Voices" },
  { value: "strange-gothic", label: "Strange & Gothic" },
  { value: "short-sharp", label: "Short & Sharp" },
  { value: "big-ideas", label: "Big Ideas" },
  { value: "hidden-gems", label: "Hidden Gems" },
];

interface QueueResult {
  queued: number;
  duplicates: number;
  queued_ids: number[];
  duplicate_ids: number[];
}

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "sb-access-token") return decodeURIComponent(value);
  }
  return null;
}

function parseGutenbergIds(raw: string): number[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);
}

export default function QueuePage() {
  const [idsInput, setIdsInput] = useState("");
  const [feedSlug, setFeedSlug] = useState(FEED_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueueResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const ids = parseGutenbergIds(idsInput);

    if (ids.length === 0) {
      setError("No valid Gutenberg IDs found. Enter numbers separated by commas or newlines.");
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/admin/queue", {
      method: "POST",
      headers,
      body: JSON.stringify({ gutenberg_ids: ids, feed_slug: feedSlug }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(body.error ?? `Request failed (${res.status})`);
    } else {
      setResult(body);
    }

    setLoading(false);
  }

  const parsedCount = parseGutenbergIds(idsInput).length;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Queue Management</h1>
        <p>Add Gutenberg titles to the processing pipeline</p>
      </div>

      <div className="queue-form">
        <form onSubmit={handleSubmit}>
          <div className="queue-form-row">
            <label className="queue-form-label" htmlFor="ids-input">
              Gutenberg IDs
              {parsedCount > 0 && (
                <span style={{ color: "var(--gold)", marginLeft: "0.5rem" }}>
                  ({parsedCount} ID{parsedCount !== 1 ? "s" : ""} detected)
                </span>
              )}
            </label>
            <textarea
              id="ids-input"
              className="queue-form-textarea"
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
              placeholder={"1342, 84, 11\n1661\n2701"}
              disabled={loading}
            />
            <p style={{ fontSize: "0.8125rem", color: "var(--ink-muted)" }}>
              Enter IDs separated by commas, spaces, or new lines.
            </p>
          </div>

          <div className="queue-form-row">
            <label className="queue-form-label" htmlFor="feed-select">
              Feed
            </label>
            <select
              id="feed-select"
              className="queue-form-select"
              value={feedSlug}
              onChange={(e) => setFeedSlug(e.target.value)}
              disabled={loading}
            >
              {FEED_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="queue-result error">{error}</div>
          )}

          {result && (
            <div className="queue-result success">
              <strong>{result.queued}</strong> title{result.queued !== 1 ? "s" : ""} queued
              {result.duplicates > 0 && (
                <span>
                  {" "}— <strong>{result.duplicates}</strong> duplicate{result.duplicates !== 1 ? "s" : ""} skipped
                  {result.duplicate_ids.length > 0 && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>
                      ({result.duplicate_ids.join(", ")})
                    </span>
                  )}
                </span>
              )}
            </div>
          )}

          <div style={{ marginTop: "1.25rem" }}>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={loading || !idsInput.trim()}
            >
              {loading ? "Adding to queue…" : "Add to Queue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
