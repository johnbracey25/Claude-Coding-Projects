import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { getSetting } from "@/lib/settings";
import { syncFeed } from "@/lib/calendar-sync";

const COLORS = ["#6f8767", "#4a90d9", "#d97556", "#8b6fb0", "#5a9e9e"];
const PINK = "#d9568a";

function isLauren(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes("lauren") || lower.includes("hacker") || lower.includes("bracey");
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Not configured yet." },
      { status: 503 }
    );
  }

  let body: { name?: string; ics_url?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const rawUrl = (body.ics_url ?? "").trim();
  const icsUrl = rawUrl.replace(/^webcal:\/\//, "https://");
  const code = (body.code ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 }
    );
  }
  if (!icsUrl || !icsUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "Please paste a valid calendar URL." },
      { status: 400 }
    );
  }

  const storedCode = await getSetting("calendar_invite_code");
  if (!storedCode || code !== storedCode) {
    return NextResponse.json(
      { error: "This link is no longer valid. Please ask Eve Research for a new one." },
      { status: 403 }
    );
  }

  // Validate the URL actually returns calendar data.
  try {
    const res = await fetch(icsUrl, {
      headers: { Accept: "text/calendar" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `That URL returned an error (${res.status}). Please double-check and try again.` },
        { status: 400 }
      );
    }
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json(
        { error: "That URL doesn't appear to be a calendar feed. Please make sure you copied the right link." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach that URL. Please double-check it and try again." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check if this URL is already connected.
  const { data: existing } = await supabase
    .from("calendar_feeds")
    .select("id")
    .eq("ics_url", icsUrl)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This calendar is already connected." },
      { status: 400 }
    );
  }

  // Lauren gets pink; everyone else rotates through the palette.
  let color: string;
  if (isLauren(name)) {
    color = PINK;
  } else {
    const { count } = await supabase
      .from("calendar_feeds")
      .select("id", { count: "exact", head: true });
    color = COLORS[(count ?? 0) % COLORS.length];
  }

  const { data: feed, error: insertErr } = await supabase
    .from("calendar_feeds")
    .insert({ name, ics_url: icsUrl, color })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: "Something went wrong saving your calendar. Please try again." },
      { status: 500 }
    );
  }

  // Sync immediately so events show up right away.
  await syncFeed(feed);

  return NextResponse.json({ ok: true });
}
