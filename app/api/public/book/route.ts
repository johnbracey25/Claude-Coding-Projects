import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { sendEmail, sendSms, chooseChannel } from "@/lib/messaging";
import { bookingConfirmation } from "@/lib/templates";
import { formatDateTime } from "@/lib/format";
import type { TimeRange } from "@/lib/scheduling";
import type { Study, Person } from "@/lib/types";

interface Selection {
  visit_number: number;
  visit_name: string;
  starts_at: string;
  duration_min: number;
}

function overlaps(aS: number, aE: number, bS: number, bE: number) {
  return aS < bE && bS < aE;
}

/**
 * Public: commit a booking for a candidate (identified by token). Re-validates
 * each chosen slot against availability + existing appointments, writes the
 * appointments, marks the candidate 'booked', and sends a confirmation.
 * POST /api/public/book { token, selections: Selection[] }
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  let body: { token?: string; selections?: Selection[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const selections = Array.isArray(body.selections) ? body.selections : [];
  if (!token || selections.length === 0) {
    return NextResponse.json({ error: "Nothing to book." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: cand } = await supabase
    .from("candidates")
    .select("id, person_id, study_id, study:studies(*), person:people(*)")
    .eq("token", token)
    .maybeSingle();
  if (!cand?.study || !cand.person) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }
  const study = cand.study as unknown as Study;
  const person = cand.person as unknown as Person;

  // Build and sanity-check the requested appointment intervals.
  const intervals = selections.map((s) => {
    const start = new Date(s.starts_at).getTime();
    const end = start + s.duration_min * 60_000;
    return { ...s, start, end };
  });
  if (intervals.some((i) => !Number.isFinite(i.start) || i.end <= i.start)) {
    return NextResponse.json({ error: "Invalid times." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const [{ data: windows }, { data: appts }] = await Promise.all([
    supabase
      .from("availability_windows")
      .select("starts_at, ends_at")
      .gte("ends_at", nowIso),
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .neq("status", "cancelled")
      .gte("ends_at", nowIso),
  ]);
  const wins = (windows ?? []) as TimeRange[];
  const busy = ((appts ?? []) as TimeRange[]).map((b) => ({
    s: new Date(b.starts_at).getTime(),
    e: new Date(b.ends_at).getTime(),
  }));

  // Each selection must sit inside an availability window and not conflict with
  // existing appointments or the other selections in this request.
  for (let i = 0; i < intervals.length; i++) {
    const iv = intervals[i];
    const inWindow = wins.some((w) => {
      const ws = new Date(w.starts_at).getTime();
      const we = new Date(w.ends_at).getTime();
      return iv.start >= ws && iv.end <= we;
    });
    if (!inWindow) {
      return NextResponse.json(
        { error: "One of those times is no longer available. Please try again." },
        { status: 409 }
      );
    }
    if (busy.some((b) => overlaps(iv.start, iv.end, b.s, b.e))) {
      return NextResponse.json(
        { error: "One of those times was just taken. Please pick another." },
        { status: 409 }
      );
    }
    for (let j = 0; j < i; j++) {
      if (overlaps(iv.start, iv.end, intervals[j].start, intervals[j].end)) {
        return NextResponse.json(
          { error: "Your selected visits overlap. Please adjust." },
          { status: 409 }
        );
      }
    }
  }

  const rows = intervals.map((iv) => ({
    candidate_id: cand.id,
    person_id: cand.person_id,
    study_id: cand.study_id,
    visit_number: iv.visit_number,
    visit_name: iv.visit_name,
    starts_at: new Date(iv.start).toISOString(),
    ends_at: new Date(iv.end).toISOString(),
    location: study.location ?? null,
    status: "scheduled",
  }));

  const { error: insErr } = await supabase.from("appointments").insert(rows);
  if (insErr) {
    return NextResponse.json({ error: "Could not save booking." }, { status: 500 });
  }

  await supabase
    .from("candidates")
    .update({ status: "booked" })
    .eq("id", cand.id);

  // Confirmation (best-effort; skipped if messaging not configured).
  const visitLines = rows.map(
    (r) => `${r.visit_name}: ${formatDateTime(r.starts_at)}`
  );
  const tpl = bookingConfirmation(person, study, visitLines);
  const channel = chooseChannel({
    email: person.email,
    phone: person.phone,
    emailOptIn: person.email_opt_in,
    smsOptIn: person.sms_opt_in,
  });
  try {
    if (channel === "email") {
      const r = await sendEmail({
        to: person.email!,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await supabase.from("messages").insert({
        person_id: person.id,
        candidate_id: cand.id,
        channel: "email",
        subject: tpl.subject,
        body: tpl.text,
        status: r.ok ? "sent" : r.skipped ? "skipped" : "failed",
        provider_id: r.providerId ?? null,
        error: r.error ?? null,
      });
    } else if (channel === "sms") {
      const r = await sendSms({ to: person.phone!, body: tpl.sms });
      await supabase.from("messages").insert({
        person_id: person.id,
        candidate_id: cand.id,
        channel: "sms",
        body: tpl.sms,
        status: r.ok ? "sent" : r.skipped ? "skipped" : "failed",
        provider_id: r.providerId ?? null,
        error: r.error ?? null,
      });
    }
  } catch {
    // Confirmation failure shouldn't fail the booking.
  }

  return NextResponse.json({ ok: true, booked: rows.length });
}
