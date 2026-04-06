"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./admin.css";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin" },
  { label: "Titles", href: "/admin/titles" },
  { label: "Queue", href: "/admin/queue" },
  { label: "QA Review", href: "/admin/qa" },
];

const PUBLIC_PATHS = ["/admin/login", "/admin/auth"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login and callback pages render without sidebar
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // Admin pages render with sidebar (middleware handles auth redirect)
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-name">{"Gü"}tenBites</span>
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
