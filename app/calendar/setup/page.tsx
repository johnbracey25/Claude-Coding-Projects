import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured, appUrl } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import {
  addFeed,
  removeFeed,
  updateFeedKeyword,
  getInviteCode,
} from "../actions";
import CalendarInviteLink from "@/components/CalendarInviteLink";
import SyncButton from "@/components/SyncButton";

export const dynamic = "force-dynamic";

interface Feed {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  keyword: string | null;
  last_synced_at: string | null;
  last_error: string | null;
}

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

const PRESET_COLORS = [
  { label: "Pink", value: "#d9568a" },
  { label: "Sage", value: "#6f8767" },
  { label: "Blue", value: "#4a90d9" },
  { label: "Coral", value: "#d97556" },
  { label: "Purple", value: "#8b6fb0" },
  { label: "Teal", value: "#5a9e9e" },
];

export default async function CalendarSetupPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <AdminNav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <SetupNotice />
        </main>
      </>
    );
  }

  const supabase = createClient();
  const inviteCode = await getInviteCode();

  const { data: feeds } = await supabase
    .from("calendar_feeds")
    .select("id, name, color, enabled, keyword, last_synced_at, last_error")
    .order("created_at", { ascending: true });

  const feedList = (feeds ?? []) as Feed[];

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/calendar"
              className="text-sm text-brand-dark hover:underline"
            >
              &larr; Back to availability
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Calendar setup
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Connect availability calendars and choose which events count as
              open time. Events sync automatically every 15 minutes.
            </p>
          </div>
          <SyncButton />
        </div>

        {/* Connected feeds */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Connected calendars
          </h2>
          {feedList.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No calendars connected yet. Add one below.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {feedList.map((f) => (
                <li key={f.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 flex-none rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {f.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {f.last_synced_at
                          ? `Last synced ${new Date(f.last_synced_at).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                          : "Not synced yet"}
                        {f.last_error && (
                          <span className="ml-2 text-rose-500">
                            Error: {f.last_error}
                          </span>
                        )}
                      </p>
                    </div>
                    <form action={removeFeed}>
                      <input type="hidden" name="id" value={f.id} />
                      <button className="text-xs text-rose-500 hover:underline">
                        Remove
                      </button>
                    </form>
                  </div>
                  <form
                    action={updateFeedKeyword}
                    className="mt-2 flex items-center gap-2 pl-6"
                  >
                    <input type="hidden" name="id" value={f.id} />
                    <span className="text-xs text-slate-500">
                      Keyword filter:
                    </span>
                    <input
                      name="keyword"
                      defaultValue={f.keyword ?? ""}
                      placeholder="e.g. Available (blank = all events)"
                      className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-brand focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Save
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Add feed form */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-600">
            Add a calendar
          </h2>
          <form action={addFeed} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Name</span>
              <input
                name="name"
                required
                placeholder="e.g. Lauren, Lisa"
                className={inputCls}
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs text-slate-500">
                ICS feed URL
              </span>
              <input
                name="ics_url"
                type="text"
                required
                placeholder="https://… or webcal://…"
                className={`${inputCls} w-full`}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Color</span>
              <select name="color" className={inputCls}>
                {PRESET_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">
                Keyword filter{" "}
                <span className="text-slate-400">(optional)</span>
              </span>
              <input
                name="keyword"
                placeholder="e.g. Available"
                className={inputCls}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Add
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            Keyword filter is optional. If set, only events whose title contains
            that word sync as availability (e.g. only events named
            &ldquo;Available&rdquo;). Leave blank to treat every event as open
            time.
          </p>
        </section>

        {/* Invite link */}
        <section className="mt-4">
          <CalendarInviteLink initialCode={inviteCode} baseUrl={appUrl} />
        </section>
      </main>
    </>
  );
}
