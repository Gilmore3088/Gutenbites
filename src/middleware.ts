import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
  // All auth checking is handled client-side in the admin layout
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
