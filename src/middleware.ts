import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login") ||
      request.nextUrl.pathname.startsWith("/admin/auth")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Dev mode: skip auth in development or when Supabase isn't configured
  if (process.env.NODE_ENV === "development" || !process.env.SUPABASE_URL) {
    return NextResponse.next();
  }

  const token = request.cookies.get("sb-access-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
