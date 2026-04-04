import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin } from "@/lib/supabase";

interface TitleRow {
  id: string;
  title: string;
  status: string;
  error_msg: string | null;
  updated_at: string;
}

interface PipelineStats {
  totalTitles: number;
  counts: Record<string, number>;
  errorCount: number;
  errorTitles: Array<{ id: string; title: string; status: string; error_msg: string | null }>;
}

export function buildPipelineStats(titles: TitleRow[]): PipelineStats {
  const counts: Record<string, number> = {};
  const errorTitles: Array<{ id: string; title: string; status: string; error_msg: string | null }> = [];

  for (const title of titles) {
    counts[title.status] = (counts[title.status] ?? 0) + 1;

    if (title.status.startsWith("error_")) {
      errorTitles.push({
        id: title.id,
        title: title.title,
        status: title.status,
        error_msg: title.error_msg,
      });
    }
  }

  return {
    totalTitles: titles.length,
    counts,
    errorCount: errorTitles.length,
    errorTitles,
  };
}

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
