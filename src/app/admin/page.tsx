"use client";

import { useEffect, useState } from "react";
import { PIPELINE_STATES } from "@/pipeline/states";

interface PipelineData {
  totalTitles: number;
  counts: Record<string, number>;
  errorCount: number;
  errorTitles: Array<{
    id: string;
    title: string;
    status: string;
    error_msg: string | null;
    updated_at: string;
  }>;
}

function getAuthToken(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "sb-access-token") return decodeURIComponent(value);
  }
  return null;
}

function StateBadge({ state }: { state: string }) {
  const cls = state.startsWith("error") ? "error" : state;
  return <span className={`state-badge ${cls}`}>{state}</span>;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  async function fetchData() {
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/admin/pipeline", { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Request failed (${res.status})`);
      setLoading(false);
      return;
    }

    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRetry(titleId: string) {
    setRetrying((prev) => ({ ...prev, [titleId]: true }));

    const token = getAuthToken();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    await fetch(`/api/admin/titles/${titleId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status: "queued" }),
    });

    setRetrying((prev) => ({ ...prev, [titleId]: false }));
    await fetchData();
  }

  if (loading) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Overview</h1>
        </div>
        <div className="admin-loading">Loading pipeline data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="admin-page-header">
          <h1>Overview</h1>
        </div>
        <div className="admin-error-msg">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Overview</h1>
        <p>{data.totalTitles} total titles in the pipeline</p>
      </div>

      <div className="pipeline-grid">
        {PIPELINE_STATES.map((state) => (
          <div key={state} className="pipeline-card">
            <span className="pipeline-card-count">
              {data.counts[state] ?? 0}
            </span>
            <span className="pipeline-card-label">{state}</span>
          </div>
        ))}

        <div className={`pipeline-card${data.errorCount > 0 ? " error-card" : ""}`}>
          <span className="pipeline-card-count">{data.errorCount}</span>
          <span className="pipeline-card-label">errors</span>
        </div>
      </div>

      {data.errorCount > 0 && (
        <div>
          <h2 className="admin-section-heading">Error Queue</h2>

          {data.errorTitles.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: "0.9375rem" }}>
              Error count reported but no titles returned.
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Error</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.errorTitles.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>
                        <StateBadge state={t.status} />
                      </td>
                      <td className="muted">{t.error_msg ?? "—"}</td>
                      <td className="mono muted">
                        {new Date(t.updated_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="admin-btn small danger"
                          disabled={retrying[t.id]}
                          onClick={() => handleRetry(t.id)}
                        >
                          {retrying[t.id] ? "Retrying…" : "Retry"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {data.errorCount === 0 && (
        <div className="admin-empty">
          <div className="admin-empty-icon">&#10003;</div>
          <h3>No errors</h3>
          <p>All titles are processing normally.</p>
        </div>
      )}
    </div>
  );
}
