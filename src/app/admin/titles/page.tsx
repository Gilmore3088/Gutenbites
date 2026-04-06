"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PIPELINE_STATES } from "@/pipeline/states";
import type { Title } from "@/lib/supabase";

const ALL_STATUSES = ["all", ...PIPELINE_STATES, "error"];

function StateBadge({ state }: { state: string }) {
  const cls = state.startsWith("error_") ? "error" : state;
  return <span className={`state-badge ${cls}`}>{state}</span>;
}

function TitlesPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "all";

  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTitles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/admin/titles?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTitles(data.titles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchTitles();
  }, [fetchTitles]);

  async function handleOverride(titleId: string, newStatus: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/titles/${titleId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: "Admin override from titles page" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setOverrideId(null);
      setOverrideStatus("");
      fetchTitles();
    } catch {
      alert("Failed to override status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Titles</h1>
        <p>{loading ? "Loading..." : `${titles.length} titles`}</p>
      </div>

      <div className="filter-bar">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.replace("_", " ")}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search title or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ padding: "1rem", background: "#fde8e8", color: "#9a1a1a", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.88rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-empty">
          <p>Loading titles...</p>
        </div>
      ) : titles.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">{"\\u{1F4DA}"}</div>
          <p>No titles found. {filterStatus !== "all" || searchQuery ? "Try adjusting your filters." : "Add some from the Queue page."}</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Feed</th>
              <th>Status</th>
              <th>Error</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {titles.map((t) => (
              <tr key={t.id}>
                <td className="mono">{t.gutenberg_id}</td>
                <td className="title-cell">
                  {t.status === "published" ? (
                    <a
                      href={`/api/rss/${t.feed_slug}`}
                      target="_blank"
                      rel="noopener"
                      style={{ color: "var(--ink)", textDecoration: "underline", textDecorationColor: "var(--gold)", textUnderlineOffset: "3px" }}
                    >
                      {t.title}
                    </a>
                  ) : (
                    t.title
                  )}
                </td>
                <td>{t.author}</td>
                <td className="mono">
                  <a
                    href={`/api/rss/${t.feed_slug}`}
                    target="_blank"
                    rel="noopener"
                    style={{ color: "var(--ink-muted)", textDecoration: "none" }}
                  >
                    {t.feed_slug}
                  </a>
                </td>
                <td><StateBadge state={t.status} /></td>
                <td className="mono" style={{ fontSize: "0.75rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.error_msg ?? "—"}
                </td>
                <td className="mono">
                  {new Date(t.updated_at).toLocaleDateString()}
                </td>
                <td>
                  {overrideId === t.id ? (
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <select
                        value={overrideStatus}
                        onChange={(e) => setOverrideStatus(e.target.value)}
                        style={{ fontSize: "0.72rem", padding: "0.25rem 0.4rem", fontFamily: "var(--font-mono)" }}
                      >
                        <option value="">Select...</option>
                        {PIPELINE_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        className="admin-btn primary"
                        disabled={!overrideStatus || saving}
                        onClick={() => handleOverride(t.id, overrideStatus)}
                        style={{ fontSize: "0.62rem", padding: "0.3rem 0.6rem" }}
                      >
                        {saving ? "..." : "Set"}
                      </button>
                      <button
                        className="admin-btn"
                        onClick={() => { setOverrideId(null); setOverrideStatus(""); }}
                        style={{ fontSize: "0.62rem", padding: "0.3rem 0.6rem" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="admin-btn"
                      onClick={() => setOverrideId(t.id)}
                      style={{ fontSize: "0.62rem", padding: "0.3rem 0.6rem" }}
                    >
                      Override
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function TitlesPage() {
  return (
    <Suspense fallback={<div className="admin-empty"><p>Loading...</p></div>}>
      <TitlesPageContent />
    </Suspense>
  );
}
