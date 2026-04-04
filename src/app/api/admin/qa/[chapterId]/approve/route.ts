import { NextRequest, NextResponse } from "next/server";
import { getSupabase, verifyAdmin, logPipelineEvent } from "@/lib/supabase";

const QA_FLAGGED_STATUS = "qa_flagged";
const PENDING_STATUS = "pending";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;

  const auth = await verifyAdmin(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: chapter, error: fetchError } = await supabase
    .from("chapters")
    .select("id, status, title_id")
    .eq("id", chapterId)
    .single();

  if (fetchError || !chapter) {
    return NextResponse.json({ error: `Chapter '${chapterId}' not found` }, { status: 404 });
  }

  if (chapter.status !== QA_FLAGGED_STATUS) {
    return NextResponse.json(
      { error: `Chapter is not in '${QA_FLAGGED_STATUS}' status (current: '${chapter.status}')` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("chapters")
    .update({ status: PENDING_STATUS })
    .eq("id", chapterId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to approve chapter" }, { status: 500 });
  }

  await logPipelineEvent(chapter.title_id, "admin_override", QA_FLAGGED_STATUS, PENDING_STATUS, {
    chapter_id: chapterId,
    admin_user_id: auth.userId,
  });

  return NextResponse.json({
    chapter_id: chapterId,
    previous_status: QA_FLAGGED_STATUS,
    new_status: PENDING_STATUS,
  });
}
