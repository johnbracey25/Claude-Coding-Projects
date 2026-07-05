"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { easternToUtcIso } from "@/lib/timezone";

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

export async function cancelAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  revalidatePath("/calendar");
}
