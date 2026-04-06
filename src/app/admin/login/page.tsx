"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-login-logo">{"Gü"}tenBites</span>
          <span className="admin-login-subtitle">Admin Dashboard</span>
        </div>

        {sent ? (
          <div className="admin-login-success">
            <p>Magic link sent to <strong>{email}</strong>.</p>
            <p>Check your inbox and click the link to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="admin-login-form">
            <label htmlFor="email" className="admin-login-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="admin-login-input"
              disabled={loading}
            />

            {error && (
              <p className="admin-login-error">{error}</p>
            )}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading || !email}
            >
              {loading ? "Sending…" : "Send Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
