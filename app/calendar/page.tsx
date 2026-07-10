import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import SyncButton from "@/components/SyncButton";

export const dynamic = "force-dynamic";

interface Feed {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  keyword: string | null;
}

interface CalEvent {
  id: string;
  feed_id: string;
  summary: string | null;
  starts_at: string;
  ends_at: string;
}

export default async function CalendarPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <AdminNav />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <SetupNotice />
        </main>
      </>
    );
  }

  const supabase = createClient();

  const { data: feeds } = await supabase
    .from("calendar_feeds")
    .select("id, name, color, enabled, keyword")
    .order("created_at", { ascending: true });

  const feedList = (feeds ?? []) as Feed[];
  const feedIds = feedList.filter((f) => f.enabled).map((f) => f.id);

  let events: CalEvent[] = [];
  if (feedIds.length > 0) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    const end = new Date(now);
    end.setDate(end.getDate() + 130);

    const { data } = await supabase
      .from("calendar_events")
      .select("id, feed_id, summary, starts_at, ends_at")
      .in("feed_id", feedIds)
      .gte("ends_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true });

    events = (data ?? []) as CalEvent[];
  }

  const feedMap = Object.fromEntries(feedList.map((f) => [f.id, f]));

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
            <p className="mt-1 text-sm text-slate-600">
              Everyone&apos;s open availability in one view. Each calendar shows
              only the events matching its keyword filter.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton compact />
            <Link
              href="/calendar/setup"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Calendar setup
            </Link>
          </div>
        </div>

        {feedList.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">No calendars connected yet.</p>
            <Link
              href="/calendar/setup"
              className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Connect a calendar
            </Link>
          </div>
        ) : (
          <>
            {events.length === 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                <p className="font-medium">
                  No availability found for the connected calendars.
                </p>
                <p className="mt-1">
                  This usually means the keyword filter doesn&apos;t match any
                  events, or the calendars haven&apos;t synced yet. Try{" "}
                  <span className="font-medium">Sync now</span> above, or check
                  the keyword filters in{" "}
                  <Link href="/calendar/setup" className="underline">
                    Calendar setup
                  </Link>
                  .
                </p>
              </div>
            )}
            <section className="mt-6">
              <AvailabilityCalendar
                feedCount={feedIds.length}
                events={events.map((e) => ({
                  id: e.id,
                  feedId: e.feed_id,
                  summary: e.summary ?? "",
                  starts_at: e.starts_at,
                  ends_at: e.ends_at,
                  color: feedMap[e.feed_id]?.color ?? "#6f8767",
                  feedName: feedMap[e.feed_id]?.name ?? "Unknown",
                }))}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}
