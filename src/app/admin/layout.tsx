"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./admin.css";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin" },
  { label: "Titles", href: "/admin/titles" },
  { label: "Queue", href: "/admin/queue" },
  { label: "QA Review", href: "/admin/qa" },
];

const PUBLIC_PATHS = ["/admin/login", "/admin/auth/callback"];

function hasAuthCookie(): boolean {
  return document.cookie.includes("sb-access-token=");
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isPublicPath) {
      setChecked(true);
      return;
    }

    if (!hasAuthCookie()) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [pathname, isPublicPath, router]);

  // Public paths (login, callback) render immediately
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Wait for auth check before rendering admin shell
  if (!checked) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-name">
            {"Gü"}tenBites
          </span>
          <span className="admin-sidebar-brand-label">Admin</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item${isActive ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="admin-content">{children}</main>
    </div>
  );
}
