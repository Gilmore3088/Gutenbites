import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";
import { buildPipelineStats } from "./stats";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
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
