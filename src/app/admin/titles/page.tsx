"use client";

import { useState } from "react";
import { PIPELINE_STATES } from "@/pipeline/states";
import type { Title } from "@/lib/supabase";

const ALL_STATUSES = ["all", ...PIPELINE_STATES, "error"];

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "sb-access-token") return decodeURIComponent(value);
  }
  return null;
}

function StateBadge({ state }: { state: string }) {
  const cls = state.startsWith("error_") ? "error" : state;
  return <span className={`state-badge ${cls}`}>{state}</span>;
}

interface OverrideState {
  titleId: string;
  currentStatus: string;
  selectedStatus: string;
  saving: boolean;
}

export default function TitlesPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [override, setOverride] = useState<OverrideState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const titles: Title[] = [];

  const filteredTitles = titles.filter((t) => {
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "error" ? t.status.startsWith("error_") : t.status === filterStatus);

    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.author.toLowerCase().includes(q) ||
      String(t.gutenberg_id).includes(q);

    return matchStatus && matchSearch;
  });

  function startOverride(t: Title) {
    setOverride({
      titleId: t.id,
      currentStatus: t.status,
      selectedStatus: t.status,
      saving: false,
    });
    setSaveError(null);
  }

  function cancelOverride() {
    setOverride(null);
    setSaveError(null);
  }

  async function saveOverride() {
    if (!override) return;

    setOverride((prev) => prev && { ...prev, saving: true });
    setSaveError(null);

    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/admin/titles/${override.titleId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: override.selectedStatus }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? `Failed (${res.status})`);
      setOverride((prev) => prev && { ...prev, saving: false });
      return;
    }

    setOverride(null);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Titles</h1>
        <p>Manage pipeline titles and override statuses</p>
      </div>

      <div
        style={{
          padding: "1rem 1.25rem",
          background: "rgba(200, 134, 10, 0.06)",
          border: "1px solid rgba(200, 134, 10, 0.2)",
          borderRadius: "6px",
          fontSize: "0.9375rem",
          color: "var(--ink-muted)",
          marginBottom: "1.5rem",
        }}
      >
        A dedicated <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.875em" }}>GET /api/admin/titles</code> endpoint is needed to load title data.
        The filter UI and table structure are scaffolded below and will populate once that endpoint exists.
      </div>

      <div className="filter-bar">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search title, author, or Gutenberg ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {saveError && (
        <div className="admin-error-msg">{saveError}</div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Gutenberg ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Feed</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTitles.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty" style={{ padding: "3rem" }}>
                    <div className="admin-empty-icon">&#9744;</div>
                    <h3>No titles</h3>
                    <p>
                      {searchQuery || filterStatus !== "all"
                        ? "No titles match your filters."
                        : "Connect a titles API endpoint to populate this table."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTitles.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.gutenberg_id}</td>
                  <td>{t.title}</td>
                  <td className="muted">{t.author}</td>
                  <td className="mono muted">{t.feed_slug}</td>
                  <td>
                    <StateBadge state={t.status} />
                  </td>
                  <td className="mono muted">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    {override?.titleId === t.id ? (
                      <div className="override-row">
                        <select
                          className="override-select"
                          value={override.selectedStatus}
                          onChange={(e) =>
                            setOverride((prev) =>
                              prev ? { ...prev, selectedStatus: e.target.value } : prev
                            )
                          }
                          disabled={override.saving}
                        >
                          {PIPELINE_STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          className="admin-btn small primary"
                          onClick={saveOverride}
                          disabled={override.saving}
                        >
                          {override.saving ? "Saving…" : "Set"}
                        </button>
                        <button
                          className="admin-btn small"
                          onClick={cancelOverride}
                          disabled={override.saving}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="admin-btn small"
                        onClick={() => startOverride(t)}
                      >
                        Override
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
