/**
 * POST /api/feedback [module: api / feedback]
 * Accepts a star rating (1-5) and optional text message from the in-app
 * feedback button. Stores the record in the user_feedback table.
 *
 * Body: { rating: number, message?: string, page?: string }
 * Response: { ok: true }
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/db/server";

interface FeedbackBody {
  rating: number;
  message?: string;
  page?: string;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: FeedbackBody;
  try {
    body = (await req.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rating, message, page } = body;
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("user_feedback").insert({
    user_id: user.id,
    rating,
    message: message?.trim() || null,
    page: page || null,
  });

  if (insertError) {
    console.error("[api/feedback] Insert error:", insertError);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
