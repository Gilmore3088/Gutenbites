"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    // Handle both PKCE (code in query) and implicit (token in hash)
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    async function authenticate() {
      try {
        if (code) {
          // PKCE flow: exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken) {
          // Implicit flow: set session from hash params
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? "",
          });
          if (error) throw error;
        } else {
          // No auth params — wait for Supabase to auto-detect
          // (some versions handle it automatically)
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Check if we have a session now
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Store token in cookie for middleware/API auth
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
          setStatus("Success! Redirecting...");
          window.location.href = "/admin";
        } else {
          setStatus("No session found. Please try logging in again.");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setStatus(`Error: ${message}`);
      }
    }

    authenticate();
  }, []);

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-login-logo">{"Gü"}tenBites</span>
          <span className="admin-login-subtitle">Admin Dashboard</span>
        </div>
        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>{status}</p>
        {status.includes("Error") || status.includes("No session") ? (
          <a
            href="/admin/login"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "1rem",
              color: "var(--gold)",
            }}
          >
            Back to Login
          </a>
        ) : null}
      </div>
    </div>
  );
}
