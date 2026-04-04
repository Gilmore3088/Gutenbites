import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { buildPipelineStats } from "./stats";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Dev mode: return empty stats when Supabase isn't configured
  if (!isSupabaseConfigured()) {
    const stats = buildPipelineStats([]);
    return NextResponse.json(stats);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("titles")
    .select("id, title, status, error_msg, updated_at");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch pipeline status" }, { status: 500 });
  }

  const stats = buildPipelineStats(data ?? []);
  return NextResponse.json(stats);
}
