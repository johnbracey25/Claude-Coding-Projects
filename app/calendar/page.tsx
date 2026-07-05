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
  saveGoogleSettings,
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

  const [icalUrl, icalKeyword, lastSync, googleKey, googleCalId] =
    await Promise.all([
      getSetting("ical_url"),
      getSetting("ical_keyword"),
      getSetting("ical_last_sync"),
      getSetting("google_service_account_json"),
      getSetting("google_calendar_id"),
    ]);
  const googleKeySaved =
    !!googleKey || !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const googleConnected = googleKeySaved && !!(googleCalId || process.env.GOOGLE_CALENDAR_ID);

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
            Availability calendar sync (read-only)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Paste the &quot;secret address in iCal format&quot; for the calendar
            that holds your open availability blocks (Lisa&apos;s). Those events
            become bookable windows and refresh automatically each day. Times when
            Lauren is busy are removed automatically. Optionally filter to only
            events whose title contains a keyword.
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

        {/* Google Calendar write-back (Lauren's calendar) */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">
              Booking write-back (Lauren&apos;s Google Calendar)
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                googleConnected
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {googleConnected ? "Connected" : "Not connected"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Paste the service-account JSON key and Lauren&apos;s calendar ID.
            Bookings will appear on her Google Calendar automatically. (You still
            need to share her calendar with the service account once, in Google
            Calendar on the web.)
          </p>
          <form action={saveGoogleSettings} className="mt-3 space-y-2">
            <input
              name="google_calendar_id"
              defaultValue={googleCalId ?? ""}
              placeholder="Calendar ID (e.g. hackerlauren@gmail.com)"
              className={`w-full ${inputCls}`}
            />
            <textarea
              name="google_service_account_json"
              rows={3}
              placeholder={
                googleKeySaved
                  ? "A key is saved. Paste a new JSON key here only to replace it."
                  : "Paste the entire service-account JSON key file here"
              }
              className={`w-full ${inputCls} font-mono text-xs`}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Save
              </button>
              {googleKeySaved && (
                <span className="text-xs text-emerald-600">✓ Key saved</span>
              )}
            </div>
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
