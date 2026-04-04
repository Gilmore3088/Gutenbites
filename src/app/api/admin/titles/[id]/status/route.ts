import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin, logPipelineEvent } from "@/lib/supabase";
import { PIPELINE_STATES } from "@/pipeline/states";

interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateStatusOverride(status: string): ValidationResult {
  if (!status) {
    return { valid: false, error: "status is required" };
  }

  if (status.startsWith("error_")) {
    return { valid: true, error: null };
  }

  if ((PIPELINE_STATES as readonly string[]).includes(status)) {
    return { valid: true, error: null };
  }

  return { valid: false, error: `Unknown status '${status}'. Must be a valid pipeline state or error_<state>` };
}

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
