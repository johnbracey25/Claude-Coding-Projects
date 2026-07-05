import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { getSetting } from "@/lib/settings";
import {
  addAvailabilityWindow,
  deleteAvailabilityWindow,
  cancelAppointment,
  saveIcalSettings,
  syncNow,
} from "./actions";
import type { AvailabilityWindow, Appointment } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ApptRow extends Appointment {
  person: { first_name: string; last_name: string } | null;
  study: { name: string } | null;
}

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default async function CalendarPage() {
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
  const nowIso = new Date().toISOString();

  const [icalUrl, icalKeyword, lastSync] = await Promise.all([
    getSetting("ical_url"),
    getSetting("ical_keyword"),
    getSetting("ical_last_sync"),
  ]);

  const [{ data: windows }, { data: appts }] = await Promise.all([
    supabase
      .from("availability_windows")
      .select("*")
      .gte("ends_at", nowIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("*, person:people(first_name,last_name), study:studies(name)")
      .neq("status", "cancelled")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true }),
  ]);

  const availability = (windows ?? []) as AvailabilityWindow[];
  const appointments = (appts ?? []) as unknown as ApptRow[];

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="mt-1 text-slate-600">
          Availability windows are the open blocks participants can book into. All
          times are US Eastern.
        </p>

        {/* Google Calendar (iCal) sync */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-600">
            Google Calendar sync (read-only)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Paste Lauren&apos;s calendar &quot;secret address in iCal format&quot;.
            Her events become bookable windows and refresh automatically every
            hour. Optionally filter to only events whose title contains a keyword.
          </p>
          <form action={saveIcalSettings} className="mt-3 space-y-2">
            <input
              name="ical_url"
              type="url"
              defaultValue={icalUrl ?? ""}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              className={`w-full ${inputCls}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                name="ical_keyword"
                defaultValue={icalKeyword ?? ""}
                placeholder="Keyword filter (optional, e.g. OPEN)"
                className={inputCls}
              />
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Save
              </button>
            </div>
          </form>
          <form action={syncNow} className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={!icalUrl}
              className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light/20 disabled:opacity-50"
            >
              Sync now
            </button>
            <span className="text-xs text-slate-400">
              {lastSync
                ? `Last synced ${formatDateTime(lastSync)}`
                : "Not synced yet"}
            </span>
          </form>
        </section>

        {/* Add availability */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-600">
            Add availability
          </h2>
          <form
            action={addAvailabilityWindow}
            className="mt-3 flex flex-wrap items-end gap-3"
          >
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Label</span>
              <input name="label" placeholder="e.g. Exam room" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Start</span>
              <input name="starts_at" type="datetime-local" required className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">End</span>
              <input name="ends_at" type="datetime-local" required className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-slate-500">Location</span>
              <input name="location" placeholder="Optional" className={inputCls} />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Add
            </button>
          </form>
        </section>

        {/* Upcoming availability */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming availability
          </h2>
          {availability.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No open windows yet. Add one above so participants have times to book.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {availability.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium text-slate-800">
                      {formatDateTime(w.starts_at)}
                    </span>{" "}
                    <span className="text-slate-400">to {formatDateTime(w.ends_at)}</span>
                    {w.label && <span className="ml-2 text-slate-500">· {w.label}</span>}
                    {w.source === "google" && (
                      <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                        Google
                      </span>
                    )}
                  </span>
                  <form action={deleteAvailabilityWindow}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="text-xs text-rose-600 hover:underline">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming appointments */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Upcoming appointments
          </h2>
          {appointments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No booked visits yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium text-slate-800">
                      {formatDateTime(a.starts_at)}
                    </span>
                    <span className="ml-2 text-slate-600">
                      {a.person
                        ? `${a.person.first_name} ${a.person.last_name}`.trim()
                        : "Someone"}
                    </span>
                    {a.study && <span className="ml-2 text-slate-400">· {a.study.name}</span>}
                    {a.visit_name && (
                      <span className="ml-2 text-slate-400">· {a.visit_name}</span>
                    )}
                  </span>
                  <form action={cancelAppointment}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-rose-600 hover:underline">Cancel</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
