import { google } from "googleapis";
import { getSetting } from "./settings";

/**
 * Google Calendar write-back via a service account. Credentials can be entered
 * in the app (Calendar page -> stored in app_settings) or via env vars. When
 * configured, each booking becomes an event on Lauren's calendar, and her
 * free/busy is used so we only offer times she's actually free. Degrades to
 * no-ops when unconfigured, so booking still works.
 */

interface Creds {
  email: string;
  key: string;
  calendarId: string;
}

/** Load credentials from app settings first, then env vars. */
async function loadCreds(): Promise<Creds | null> {
  const jsonRaw =
    (await getSetting("google_service_account_json")) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    "";
  const calendarId =
    (await getSetting("google_calendar_id")) ||
    process.env.GOOGLE_CALENDAR_ID ||
    "";
  if (!calendarId) return null;

  if (jsonRaw) {
    try {
      const json = JSON.parse(jsonRaw) as {
        client_email?: string;
        private_key?: string;
      };
      if (json.client_email && json.private_key) {
        return { email: json.client_email, key: json.private_key, calendarId };
      }
    } catch {
      return null;
    }
  }
  // Fallback: separate env vars (key stored with literal "\n").
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (email && key) return { email, key, calendarId };
  return null;
}

function calendarClient(creds: Creds) {
  const auth = new google.auth.JWT({
    email: creds.email,
    key: creds.key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  startIso: string;
  endIso: string;
}

/** Create an event; returns the Google event id, or null if unconfigured/failed. */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string | null> {
  const creds = await loadCreds();
  if (!creds) return null;
  try {
    const calendar = calendarClient(creds);
    const res = await calendar.events.insert({
      calendarId: creds.calendarId,
      requestBody: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
      },
    });
    return res.data.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Lauren's busy intervals (free/busy). Used so we only offer times she's free.
 * Returns [] if unconfigured or on error.
 */
export async function getLaurenBusy(
  timeMinIso: string,
  timeMaxIso: string
): Promise<{ starts_at: string; ends_at: string }[]> {
  const creds = await loadCreds();
  if (!creds) return [];
  try {
    const calendar = calendarClient(creds);
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMinIso,
        timeMax: timeMaxIso,
        items: [{ id: creds.calendarId }],
      },
    });
    const busy = res.data.calendars?.[creds.calendarId]?.busy ?? [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ starts_at: b.start!, ends_at: b.end! }));
  } catch {
    return [];
  }
}

/** Delete a previously-created event. No-op if unconfigured or already gone. */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!eventId) return;
  const creds = await loadCreds();
  if (!creds) return;
  try {
    const calendar = calendarClient(creds);
    await calendar.events.delete({ calendarId: creds.calendarId, eventId });
  } catch {
    // Ignore (already deleted, or transient).
  }
}
