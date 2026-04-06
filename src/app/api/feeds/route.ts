import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ feeds: [] });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("feeds")
    .select("slug, name, description")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ feeds: data ?? [] });
}
