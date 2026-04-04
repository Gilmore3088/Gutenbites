"use client";

import { useState } from "react";

interface PronunciationHint {
  word: string;
  phonetic: string;
}

interface FlaggedChapter {
  id: string;
  title: string;
  author: string;
  chapterNum: number;
  chapterTitle: string;
  pronunciationHints: PronunciationHint[];
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

function QaCard({
  chapter,
  onApprove,
  onReject,
}: {
  chapter: FlaggedChapter;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await onApprove(chapter.id);
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    await onReject(chapter.id);
    setLoading(false);
  }

  return (
    <div className="qa-card">
      <div className="qa-card-header">
        <div>
          <div className="qa-card-title">
            {chapter.title}
          </div>
          <div className="qa-card-meta">
            {chapter.author} — Chapter {chapter.chapterNum}
            {chapter.chapterTitle ? `: ${chapter.chapterTitle}` : ""}
          </div>
        </div>

        <div className="qa-card-actions">
          <button
            className="admin-btn small danger"
            onClick={handleReject}
            disabled={loading}
          >
            Reject
          </button>
          <button
            className="admin-btn small primary"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? "Saving…" : "Approve"}
          </button>
        </div>
      </div>

      {chapter.pronunciationHints.length > 0 && (
        <div className="qa-card-body">
          <p className="qa-flags-label">Pronunciation hints</p>
          <ul className="qa-flags-list">
            {chapter.pronunciationHints.map((hint, i) => (
              <li key={i} className="qa-flag-item">
                <span className="qa-flag-word">{hint.word}</span>
                <span className="qa-flag-phonetic">{hint.phonetic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function QaReviewPage() {
  const [chapters, setChapters] = useState<FlaggedChapter[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleApprove(chapterId: string) {
    setActionError(null);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/admin/qa/${chapterId}/approve`, {
      method: "POST",
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setActionError(body.error ?? `Approval failed (${res.status})`);
      return;
    }

    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  }

  async function handleReject(chapterId: string) {
    setActionError(null);
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>QA Review</h1>
        <p>Review and approve flagged chapters before publication</p>
      </div>

      {actionError && (
        <div className="admin-error-msg">{actionError}</div>
      )}

      {chapters.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">&#10003;</div>
          <h3>No chapters pending QA review</h3>
          <p>All flagged chapters have been reviewed. Check back after the next pipeline run.</p>
        </div>
      ) : (
        <div>
          {chapters.map((chapter) => (
            <QaCard
              key={chapter.id}
              chapter={chapter}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
