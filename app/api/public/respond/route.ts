import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sanitizeAvailability } from "@/lib/availability";

/**
 * Public endpoint for a participant responding to an invite via /r/<token>.
 * No auth — guarded by the unguessable candidate token.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  let body: {
    token?: string;
    choice?: "interested" | "declined";
    availability?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const interested = body.choice === "interested";
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: cand } = await supabase
    .from("candidates")
    .select("id")
    .eq("token", token)
    .maybeSingle();
  if (!cand) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("candidates")
    .update({
      status: interested ? "responded" : "declined",
      response: interested ? "interested" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", cand.id);
  if (error) {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }

  // Save availability separately and best-effort: if the column hasn't been
  // migrated yet, we don't want to fail the whole response.
  if (interested) {
    const availability = sanitizeAvailability(body.availability);
    if (availability) {
      await supabase
        .from("candidates")
        .update({ availability_pref: availability })
        .eq("id", cand.id);
    }
  }

  return NextResponse.json({ ok: true });
}
