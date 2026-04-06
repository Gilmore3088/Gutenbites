import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Public admin paths — always allow
  if (
    request.nextUrl.pathname.startsWith("/admin/login") ||
    request.nextUrl.pathname.startsWith("/admin/auth")
  ) {
    return NextResponse.next();
  }

  // API routes handle their own auth
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // In development, skip auth
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // In production, check for auth cookie
  const token = request.cookies.get("sb-access-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
