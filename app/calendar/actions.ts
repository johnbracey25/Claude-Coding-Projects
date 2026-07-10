"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncAllFeeds, syncFeed } from "@/lib/calendar-sync";
import { getSetting, setSetting } from "@/lib/settings";

export async function addFeed(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const ics_url = String(formData.get("ics_url") ?? "").trim();
  const color = String(formData.get("color") ?? "#6f8767").trim();
  const keyword = String(formData.get("keyword") ?? "").trim() || null;

  if (!name || !ics_url) throw new Error("Name and URL are required.");

  const normalizedUrl = ics_url.replace(/^webcal:\/\//, "https://");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("calendar_feeds")
    .insert({ name, ics_url: normalizedUrl, color, keyword })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await syncFeed(data);
  revalidatePath("/calendar");
}

export async function updateFeedKeyword(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const keyword = String(formData.get("keyword") ?? "").trim() || null;
  if (!id) return;
  const supabase = createClient();
  await supabase.from("calendar_feeds").update({ keyword }).eq("id", id);
  revalidatePath("/calendar");
}

export async function removeFeed(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  await supabase.from("calendar_feeds").delete().eq("id", id);
  revalidatePath("/calendar");
}

export async function toggleFeed(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!id) return;
  const supabase = createClient();
  await supabase.from("calendar_feeds").update({ enabled }).eq("id", id);
  revalidatePath("/calendar");
}

export async function syncNow() {
  await syncAllFeeds();
  revalidatePath("/calendar");
}

export async function generateInviteLink(): Promise<string> {
  const code = crypto.randomUUID().slice(0, 8);
  await setSetting("calendar_invite_code", code);
  revalidatePath("/calendar");
  return code;
}

export async function getInviteCode(): Promise<string | null> {
  return getSetting("calendar_invite_code");
}
