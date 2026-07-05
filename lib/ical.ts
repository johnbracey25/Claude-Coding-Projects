import { APP_TZ, zonedToUtcIso } from "./timezone";

/**
 * Minimal iCalendar (.ics) parser for pulling availability events out of a
 * Google Calendar "secret address in iCal format" feed. Handles the common
 * cases: UTC (…Z), TZID-qualified local times, and folded lines. All-day
 * (VALUE=DATE) and recurring (RRULE) events are skipped for now — availability
 * blocks are expected to be normal timed, one-off events.
 */

export interface IcalEvent {
  uid: string;
  summary: string;
  startUtc: string;
  endUtc: string;
}

/** Join folded lines (continuations begin with a space or tab). */
function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Parse a property line into { name, params, value }. */
function parseLine(line: string) {
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = left.split(";");
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const eq = p.indexOf("=");
    if (eq !== -1) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

/** Convert a DTSTART/DTEND value + params to a UTC ISO instant, or null. */
function toUtc(value: string, params: Record<string, string>): string | null {
  if (params.VALUE === "DATE") return null; // all-day: skip
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, z] = m;
  if (z === "Z") {
    return new Date(
      Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss)
    ).toISOString();
  }
  const tz = params.TZID || APP_TZ;
  try {
    return zonedToUtcIso(+y, +mo, +d, +hh, +mm, tz);
  } catch {
    // Unknown TZID: fall back to Eastern.
    return zonedToUtcIso(+y, +mo, +d, +hh, +mm, APP_TZ);
  }
}

export function parseIcs(text: string): IcalEvent[] {
  const lines = unfold(text);
  const events: IcalEvent[] = [];
  let cur: Partial<IcalEvent> & { hasRrule?: boolean } = {};
  let inEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (
        inEvent &&
        !cur.hasRrule &&
        cur.startUtc &&
        cur.endUtc &&
        cur.endUtc > cur.startUtc
      ) {
        events.push({
          uid: cur.uid ?? `${cur.startUtc}-${cur.endUtc}`,
          summary: cur.summary ?? "",
          startUtc: cur.startUtc,
          endUtc: cur.endUtc,
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const p = parseLine(line);
    if (!p) continue;
    if (p.name === "RRULE") cur.hasRrule = true;
    else if (p.name === "UID") cur.uid = p.value;
    else if (p.name === "SUMMARY") cur.summary = p.value;
    else if (p.name === "DTSTART") cur.startUtc = toUtc(p.value, p.params) ?? undefined;
    else if (p.name === "DTEND") cur.endUtc = toUtc(p.value, p.params) ?? undefined;
  }

  return events;
}
