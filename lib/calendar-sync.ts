import { createAdminClient } from "./supabase/admin";
import { getSetting } from "./settings";
import { parseIcs } from "./ical";

/**
 * Pull availability from Lauren's Google Calendar via its secret iCal feed and
 * mirror it into availability_windows (source='google'). Read-only: booked
 * appointments are NOT written back to Google (that needs the Calendar API).
 *
 * Strategy: fetch → parse future events → optional keyword filter → replace all
 * existing source='google' windows with the fresh set (idempotent).
 */

export interface SyncResult {
  ok: boolean;
  imported: number;
  error?: string;
}

export async function syncFromIcal(): Promise<SyncResult> {
  const url = await getSetting("ical_url");
  if (!url) return { ok: false, imported: 0, error: "No iCal URL configured." };
  const keyword = (await getSetting("ical_keyword"))?.trim().toLowerCase() || "";

  let text: string;
  try {
    const res = await fetch(url, { headers: { Accept: "text/calendar" } });
    if (!res.ok) {
      return { ok: false, imported: 0, error: `Feed returned ${res.status}.` };
    }
    text = await res.text();
  } catch (e) {
    return {
      ok: false,
      imported: 0,
      error: e instanceof Error ? e.message : "Could not fetch feed.",
    };
  }

  const now = Date.now();
  const events = parseIcs(text)
    .filter((e) => new Date(e.endUtc).getTime() > now)
    .filter((e) => (keyword ? e.summary.toLowerCase().includes(keyword) : true));

  const supabase = createAdminClient();

  // Replace the previous Google-sourced windows with the current set.
  await supabase.from("availability_windows").delete().eq("source", "google");

  if (events.length > 0) {
    const rows = events.map((e) => ({
      label: e.summary || "Google Calendar",
      starts_at: e.startUtc,
      ends_at: e.endUtc,
      source: "google",
      google_event_id: e.uid,
    }));
    const { error } = await supabase.from("availability_windows").insert(rows);
    if (error) return { ok: false, imported: 0, error: error.message };
  }

  await supabase.from("app_settings").upsert({
    key: "ical_last_sync",
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return { ok: true, imported: events.length };
}
