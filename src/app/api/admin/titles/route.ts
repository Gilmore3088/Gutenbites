import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ titles: [] });
  }

  const supabase = getSupabase();

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q");

  let query = supabase
    .from("titles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    if (status === "error") {
      query = query.like("status", "error_%");
    } else {
      query = query.eq("status", status);
    }
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ titles: data ?? [] });
}
