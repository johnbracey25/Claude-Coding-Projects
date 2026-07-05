import { google } from "googleapis";
import { isGoogleCalendarConfigured } from "./config";

/**
 * Google Calendar write-back via a service account. When configured, each
 * booking becomes an event on Lauren's calendar (GOOGLE_CALENDAR_ID), so she
 * sees who's coming. Degrades gracefully: if not configured, these are no-ops
 * and booking still works (the app's own Calendar page always has the truth).
 */

function credentials(): { email: string; key: string } {
  // Preferred: the whole service-account JSON pasted into one env var. Parsing
  // it yields a private_key with real newlines already.
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const json = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    return { email: json.client_email ?? "", key: json.private_key ?? "" };
  }
  // Fallback: separate vars (key stored with literal "\n").
  return {
    email: process.env.GOOGLE_CLIENT_EMAIL ?? "",
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  };
}

function calendarClient() {
  const { email, key } = credentials();
  const auth = new google.auth.JWT({
    email,
    key,
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
  if (!isGoogleCalendarConfigured) return null;
  try {
    const calendar = calendarClient();
    const res = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
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

/** Delete a previously-created event. No-op if unconfigured or already gone. */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!isGoogleCalendarConfigured || !eventId) return;
  try {
    const calendar = calendarClient();
    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID!,
      eventId,
    });
  } catch {
    // Ignore (already deleted, or transient).
  }
}
