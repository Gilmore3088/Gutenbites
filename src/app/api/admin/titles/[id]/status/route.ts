import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin, logPipelineEvent } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/config";
import { validateStatusOverride } from "./validate";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: { status: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = validateStatusOverride(body.status);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      id,
      previous_status: "unknown",
      new_status: body.status,
      dev_mode: true,
    });
  }

  const supabase = getSupabase();

  const { data: current, error: fetchError } = await supabase
    .from("titles")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: `Title '${id}' not found` }, { status: 404 });
  }

  const previousStatus = current.status;

  const { error: updateError } = await supabase
    .from("titles")
    .update({ status: body.status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  await logPipelineEvent(id, "admin_override", previousStatus, body.status, {
    admin_user_id: auth.userId,
  });

  return NextResponse.json({
    id,
    previous_status: previousStatus,
    new_status: body.status,
  });
}
