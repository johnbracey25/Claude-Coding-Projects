import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { computeSlots, gapRange, type TimeRange } from "@/lib/scheduling";
import type { Study } from "@/lib/types";

/**
 * Public: available slot start times for a given visit of a study, for the
 * participant identified by their candidate token. For visit 2+, pass `after`
 * (the chosen prior visit start) so the gap rules apply.
 * GET /api/public/slots?token=..&visit=0&after=ISO
 */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not available." }, { status: 503 });
  }

  const token = req.nextUrl.searchParams.get("token") ?? "";
  const visitIndex = Number(req.nextUrl.searchParams.get("visit") ?? "0");
  const after = req.nextUrl.searchParams.get("after");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: cand } = await supabase
    .from("candidates")
    .select("id, study:studies(*)")
    .eq("token", token)
    .maybeSingle();
  if (!cand?.study) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }
  const study = cand.study as unknown as Study;
  const visits = study.visit_plan?.visits ?? [];
  const visit = visits[visitIndex];
  if (!visit) {
    return NextResponse.json({ error: "No such visit." }, { status: 400 });
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

  // Combine the visit-gap range with the study's recruiting window.
  const gap = gapRange(after, visit);
  let rangeStart = gap.rangeStart;
  let rangeEnd = gap.rangeEnd;
  if (study.start_window) {
    const s = new Date(`${study.start_window}T00:00:00Z`);
    rangeStart = rangeStart && rangeStart > s ? rangeStart : s;
  }
  if (study.end_window) {
    const e = new Date(`${study.end_window}T23:59:59Z`);
    rangeEnd = rangeEnd && rangeEnd < e ? rangeEnd : e;
  }

  const slots = computeSlots({
    windows: (windows ?? []) as TimeRange[],
    busy: (appts ?? []) as TimeRange[],
    durationMin: visit.duration_min,
    stepMin: 30,
    rangeStart,
    rangeEnd,
    maxSlots: 200,
  });

  return NextResponse.json({
    slots,
    visit: { index: visitIndex, name: visit.name, duration_min: visit.duration_min },
    totalVisits: visits.length,
  });
}
