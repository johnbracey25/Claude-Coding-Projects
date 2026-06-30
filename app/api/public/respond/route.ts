import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

/**
 * Public endpoint for a participant responding to an invite via /r/<token>.
 * No auth — guarded by the unguessable candidate token.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  let body: { token?: string; choice?: "interested" | "declined" };
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

  return NextResponse.json({ ok: true });
}
