import { APP_TZ, zonedToUtcIso } from "./timezone";

/**
 * Minimal iCalendar (.ics) parser for pulling availability events out of a
 * published calendar feed (Apple iCloud, Google, etc.). Handles the common
 * cases we see in practice:
 *   - UTC (…Z), TZID-qualified local times, and floating times
 *   - all-day (VALUE=DATE) events
 *   - recurring events (RRULE) with FREQ=DAILY/WEEKLY/MONTHLY, INTERVAL, COUNT,
 *     UNTIL, and BYDAY — expanded into concrete occurrences
 *   - EXDATE exclusions
 *
 * Recurring events are expanded from now to a fixed horizon so weekly
 * availability blocks (very common in Apple Calendar) actually show up.
 */

export interface IcalEvent {
  uid: string;
  summary: string;
  startUtc: string;
  endUtc: string;
}

/** How far ahead to expand recurring events. */
const HORIZON_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_OCCURRENCES = 400;

const WEEKDAY: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

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

interface WallTime {
  y: number;
  mo: number;
  d: number;
  hh: number;
  mm: number;
  isDate: boolean; // all-day
  isUtc: boolean; // had trailing Z
  tz: string | null; // TZID param
}

/** Parse a DTSTART/DTEND value + params into wall-clock components. */
function parseTime(value: string, params: Record<string, string>): WallTime | null {
  if (params.VALUE === "DATE" || /^\d{8}$/.test(value)) {
    const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d] = m;
    return { y: +y, mo: +mo, d: +d, hh: 0, mm: 0, isDate: true, isUtc: false, tz: null };
  }
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, , z] = m;
  return {
    y: +y,
    mo: +mo,
    d: +d,
    hh: +hh,
    mm: +mm,
    isDate: false,
    isUtc: z === "Z",
    tz: params.TZID ?? null,
  };
}

/** Convert a wall-clock time to a UTC millisecond instant. */
function toUtcMs(w: WallTime): number {
  if (w.isUtc) {
    return Date.UTC(w.y, w.mo - 1, w.d, w.hh, w.mm, 0);
  }
  const tz = w.tz || APP_TZ;
  try {
    return new Date(zonedToUtcIso(w.y, w.mo, w.d, w.hh, w.mm, tz)).getTime();
  } catch {
    return new Date(zonedToUtcIso(w.y, w.mo, w.d, w.hh, w.mm, APP_TZ)).getTime();
  }
}

/** Same wall-clock time, but on a different calendar date, converted to UTC ms. */
function toUtcMsOnDate(w: WallTime, y: number, mo: number, d: number): number {
  return toUtcMs({ ...w, y, mo, d });
}

interface Rrule {
  freq: string;
  interval: number;
  count: number | null;
  untilMs: number | null;
  byday: number[] | null;
}

function parseRrule(value: string): Rrule | null {
  const parts: Record<string, string> = {};
  for (const kv of value.split(";")) {
    const eq = kv.indexOf("=");
    if (eq !== -1) parts[kv.slice(0, eq).toUpperCase()] = kv.slice(eq + 1);
  }
  if (!parts.FREQ) return null;
  let untilMs: number | null = null;
  if (parts.UNTIL) {
    const w = parseTime(parts.UNTIL, {});
    if (w) untilMs = toUtcMs(w);
  }
  const byday = parts.BYDAY
    ? parts.BYDAY.split(",")
        .map((tok) => WEEKDAY[tok.replace(/^[+-]?\d+/, "").trim()])
        .filter((n): n is number => n !== undefined)
    : null;
  return {
    freq: parts.FREQ.toUpperCase(),
    interval: parts.INTERVAL ? Math.max(1, parseInt(parts.INTERVAL, 10)) : 1,
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : null,
    untilMs,
    byday: byday && byday.length ? byday : null,
  };
}

/** Weekday (0=Sun..6=Sat) of a calendar date, tz-independent. */
function weekdayOf(y: number, mo: number, d: number): number {
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Monday-based day index for computing weekly intervals. */
function mondayIndex(y: number, mo: number, d: number): number {
  const base = Date.UTC(y, mo - 1, d);
  const wd = (new Date(base).getUTCDay() + 6) % 7; // 0 = Monday
  return Math.floor((base - wd * DAY_MS) / (7 * DAY_MS));
}

/**
 * Expand a recurring event into concrete occurrences within [nowMs, horizonMs].
 * Returns start/end UTC ms pairs.
 */
function expandRecurrence(
  start: WallTime,
  durationMs: number,
  rrule: Rrule,
  exdates: Set<string>,
  nowMs: number,
  horizonMs: number
): Array<{ startMs: number; endMs: number }> {
  const out: Array<{ startMs: number; endMs: number }> = [];
  const startWeekIdx = mondayIndex(start.y, start.mo, start.d);
  let emitted = 0;
  let generated = 0;

  const push = (y: number, mo: number, d: number) => {
    const startMs = toUtcMsOnDate(start, y, mo, d);
    if (rrule.untilMs != null && startMs > rrule.untilMs) return false;
    if (startMs > horizonMs) return false;
    const endMs = startMs + durationMs;
    const key = `${y}-${mo}-${d}`;
    if (!exdates.has(key) && endMs > nowMs) {
      out.push({ startMs, endMs });
    }
    generated += 1;
    return true;
  };

  if (rrule.freq === "DAILY") {
    for (let k = 0; k < 366 * 2; k++) {
      const dt = new Date(Date.UTC(start.y, start.mo - 1, start.d + k * rrule.interval));
      const y = dt.getUTCFullYear();
      const mo = dt.getUTCMonth() + 1;
      const d = dt.getUTCDate();
      if (toUtcMsOnDate(start, y, mo, d) > horizonMs) break;
      if (rrule.count != null && emitted >= rrule.count) break;
      if (!push(y, mo, d)) break;
      emitted += 1;
      if (generated > MAX_OCCURRENCES) break;
    }
  } else if (rrule.freq === "WEEKLY") {
    const bydays = rrule.byday ?? [weekdayOf(start.y, start.mo, start.d)];
    for (let k = 0; k < 366 * 2; k++) {
      const dt = new Date(Date.UTC(start.y, start.mo - 1, start.d + k));
      const y = dt.getUTCFullYear();
      const mo = dt.getUTCMonth() + 1;
      const d = dt.getUTCDate();
      const startMs = toUtcMsOnDate(start, y, mo, d);
      if (startMs > horizonMs) break;
      if (rrule.count != null && emitted >= rrule.count) break;
      const wIdx = mondayIndex(y, mo, d) - startWeekIdx;
      if (wIdx % rrule.interval !== 0) continue;
      if (!bydays.includes(weekdayOf(y, mo, d))) continue;
      if (startMs < toUtcMs(start)) continue; // don't go before DTSTART
      push(y, mo, d);
      emitted += 1;
      if (generated > MAX_OCCURRENCES) break;
    }
  } else if (rrule.freq === "MONTHLY") {
    for (let k = 0; k < 60; k++) {
      const dt = new Date(Date.UTC(start.y, start.mo - 1 + k * rrule.interval, start.d));
      const y = dt.getUTCFullYear();
      const mo = dt.getUTCMonth() + 1;
      const d = dt.getUTCDate();
      if (toUtcMsOnDate(start, y, mo, d) > horizonMs) break;
      if (rrule.count != null && emitted >= rrule.count) break;
      if (!push(y, mo, d)) break;
      emitted += 1;
      if (generated > MAX_OCCURRENCES) break;
    }
  } else {
    // Unknown frequency: emit the single base occurrence if in-window.
    const startMs = toUtcMs(start);
    if (startMs + durationMs > nowMs && startMs <= horizonMs) {
      out.push({ startMs, endMs: startMs + durationMs });
    }
  }

  return out;
}

export function parseIcs(text: string, nowMs: number = Date.now()): IcalEvent[] {
  const lines = unfold(text);
  const events: IcalEvent[] = [];
  const horizonMs = nowMs + HORIZON_DAYS * DAY_MS;

  let inEvent = false;
  let uid: string | undefined;
  let summary = "";
  let dtStart: WallTime | null = null;
  let dtEnd: WallTime | null = null;
  let rrule: Rrule | null = null;
  let exdates = new Set<string>();

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      uid = undefined;
      summary = "";
      dtStart = null;
      dtEnd = null;
      rrule = null;
      exdates = new Set();
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && dtStart) {
        // All-day events with no DTEND default to a one-day block.
        let endWall = dtEnd;
        if (!endWall) {
          if (dtStart.isDate) {
            const next = new Date(
              Date.UTC(dtStart.y, dtStart.mo - 1, dtStart.d + 1)
            );
            endWall = {
              ...dtStart,
              y: next.getUTCFullYear(),
              mo: next.getUTCMonth() + 1,
              d: next.getUTCDate(),
            };
          } else {
            endWall = { ...dtStart, hh: dtStart.hh + 1 };
          }
        }
        const startMs = toUtcMs(dtStart);
        const endMs = toUtcMs(endWall);
        const durationMs = Math.max(endMs - startMs, 0) || DAY_MS;

        const baseUid = uid ?? `${startMs}-${endMs}`;

        if (rrule) {
          const occ = expandRecurrence(
            dtStart,
            durationMs,
            rrule,
            exdates,
            nowMs,
            horizonMs
          );
          for (const o of occ) {
            events.push({
              uid: `${baseUid}-${o.startMs}`,
              summary,
              startUtc: new Date(o.startMs).toISOString(),
              endUtc: new Date(o.endMs).toISOString(),
            });
          }
        } else if (endMs > startMs && endMs > nowMs && startMs <= horizonMs) {
          events.push({
            uid: baseUid,
            summary,
            startUtc: new Date(startMs).toISOString(),
            endUtc: new Date(endMs).toISOString(),
          });
        }
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const p = parseLine(line);
    if (!p) continue;
    if (p.name === "UID") uid = p.value;
    else if (p.name === "SUMMARY") summary = p.value;
    else if (p.name === "DTSTART") dtStart = parseTime(p.value, p.params);
    else if (p.name === "DTEND") dtEnd = parseTime(p.value, p.params);
    else if (p.name === "RRULE") rrule = parseRrule(p.value);
    else if (p.name === "EXDATE") {
      for (const v of p.value.split(",")) {
        const w = parseTime(v, p.params);
        if (w) exdates.add(`${w.y}-${w.mo}-${w.d}`);
      }
    }
  }

  return events;
}
