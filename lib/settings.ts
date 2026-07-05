import { createAdminClient } from "./supabase/admin";

/** Small key/value settings store (server-only). */

export async function getSetting(key: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
}
