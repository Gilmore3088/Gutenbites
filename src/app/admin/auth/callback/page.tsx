"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const supabase = getSupabaseBrowser();

      // Supabase JS client auto-detects hash fragments and exchanges them
      const { data, error: authError } = await supabase.auth.getSession();

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.session) {
        // Set cookie so middleware and API routes can read it
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        router.push("/admin");
      } else {
        // No session yet — might be loading. Listen for auth state change.
        const { data: listener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === "SIGNED_IN" && session) {
              document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
              router.push("/admin");
            }
          }
        );

        // Cleanup after 10 seconds if nothing happens
        setTimeout(() => {
          listener.subscription.unsubscribe();
          setError("Authentication timed out. Please try logging in again.");
        }, 10000);
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <p style={{ color: "#9a1a1a", marginBottom: "1rem" }}>{error}</p>
          <a href="/admin/login" className="admin-login-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <p>Signing you in...</p>
      </div>
    </div>
  );
}
