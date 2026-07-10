import { createAdminClient } from "./supabase/admin";
import { parseIcs } from "./ical";

export interface FeedSyncResult {
  feedId: string;
  name: string;
  ok: boolean;
  imported: number;
  error?: string;
}

export interface SyncResult {
  ok: boolean;
  imported: number;
  feeds: FeedSyncResult[];
  error?: string;
}

export async function syncAllFeeds(): Promise<SyncResult> {
  const supabase = createAdminClient();
  const { data: feeds, error: feedErr } = await supabase
    .from("calendar_feeds")
    .select("*")
    .eq("enabled", true);

  if (feedErr) return { ok: false, imported: 0, feeds: [], error: feedErr.message };
  if (!feeds || feeds.length === 0) return { ok: true, imported: 0, feeds: [] };

  const results: FeedSyncResult[] = [];
  let totalImported = 0;

  for (const feed of feeds) {
    const result = await syncFeed(feed);
    results.push(result);
    if (result.ok) totalImported += result.imported;
  }

  return {
    ok: results.every((r) => r.ok),
    imported: totalImported,
    feeds: results,
  };
}

export async function syncFeed(feed: {
  id: string;
  name: string;
  ics_url: string;
  keyword?: string | null;
}): Promise<FeedSyncResult> {
  const supabase = createAdminClient();
  const base = { feedId: feed.id, name: feed.name };

  let text: string;
  try {
    const res = await fetch(feed.ics_url, { headers: { Accept: "text/calendar" } });
    if (!res.ok) {
      const err = `Feed returned ${res.status}.`;
      await supabase
        .from("calendar_feeds")
        .update({ last_error: err, last_synced_at: new Date().toISOString() })
        .eq("id", feed.id);
      return { ...base, ok: false, imported: 0, error: err };
    }
    text = await res.text();
  } catch (e) {
    const err = e instanceof Error ? e.message : "Could not fetch feed.";
    await supabase
      .from("calendar_feeds")
      .update({ last_error: err, last_synced_at: new Date().toISOString() })
      .eq("id", feed.id);
    return { ...base, ok: false, imported: 0, error: err };
  }

  const keyword = (feed.keyword ?? "").trim().toLowerCase();
  const now = Date.now();
  const events = parseIcs(text)
    .filter((e) => new Date(e.endUtc).getTime() > now)
    .filter((e) => (keyword ? e.summary.toLowerCase().includes(keyword) : true));

  await supabase.from("calendar_events").delete().eq("feed_id", feed.id);

  if (events.length > 0) {
    const rows = events.map((e) => ({
      feed_id: feed.id,
      uid: e.uid,
      summary: e.summary || feed.name,
      starts_at: e.startUtc,
      ends_at: e.endUtc,
    }));
    const { error } = await supabase.from("calendar_events").insert(rows);
    if (error) {
      await supabase
        .from("calendar_feeds")
        .update({ last_error: error.message, last_synced_at: new Date().toISOString() })
        .eq("id", feed.id);
      return { ...base, ok: false, imported: 0, error: error.message };
    }
  }

  await supabase
    .from("calendar_feeds")
    .update({ last_error: null, last_synced_at: new Date().toISOString() })
    .eq("id", feed.id);

  return { ...base, ok: true, imported: events.length };
}

// Keep backward compat for the old single-feed sync (used by existing cron)
export async function syncFromIcal(): Promise<SyncResult> {
  return syncAllFeeds();
}
