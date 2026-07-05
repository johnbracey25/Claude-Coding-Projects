"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { easternToUtcIso } from "@/lib/timezone";
import { setSetting } from "@/lib/settings";
import { syncFromIcal } from "@/lib/calendar-sync";
import { deleteCalendarEvent } from "@/lib/google";

/**
 * Turn a datetime-local value ("2026-07-10T09:00"), entered in US Eastern, into
 * a true UTC instant for storage.
 */
function toIso(v: string): string | null {
  return v ? easternToUtcIso(v) : null;
}

/** Add an availability window that participants can book into. */
export async function addAvailabilityWindow(formData: FormData) {
  const starts_at = toIso(String(formData.get("starts_at") ?? ""));
  const ends_at = toIso(String(formData.get("ends_at") ?? ""));
  if (!starts_at || !ends_at || ends_at <= starts_at) {
    throw new Error("Please provide a valid start and end time.");
  }
  const supabase = createClient();
  const { error } = await supabase.from("availability_windows").insert({
    label: String(formData.get("label") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    starts_at,
    ends_at,
    source: "manual",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}

export async function deleteAvailabilityWindow(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  await supabase.from("availability_windows").delete().eq("id", id);
  revalidatePath("/calendar");
}

/** Save the Google Calendar iCal feed URL + optional keyword filter. */
export async function saveIcalSettings(formData: FormData) {
  const url = String(formData.get("ical_url") ?? "").trim();
  const keyword = String(formData.get("ical_keyword") ?? "").trim();
  await setSetting("ical_url", url);
  await setSetting("ical_keyword", keyword);
  revalidatePath("/calendar");
}

/** Pull availability from the configured iCal feed now. */
export async function syncNow() {
  await syncFromIcal();
  revalidatePath("/calendar");
}

/**
 * Save the Google service-account credentials for booking write-back. The JSON
 * key is only updated when a new one is pasted (so it isn't cleared on save).
 */
export async function saveGoogleSettings(formData: FormData) {
  const json = String(formData.get("google_service_account_json") ?? "").trim();
  const calendarId = String(formData.get("google_calendar_id") ?? "").trim();
  if (json) await setSetting("google_service_account_json", json);
  await setSetting("google_calendar_id", calendarId);
  revalidatePath("/calendar");
}

export async function cancelAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("google_event_id")
    .single();
  // Remove the mirrored event from Lauren's Google Calendar, if any.
  if (appt?.google_event_id) {
    await deleteCalendarEvent(appt.google_event_id);
  }
  revalidatePath("/calendar");
}
