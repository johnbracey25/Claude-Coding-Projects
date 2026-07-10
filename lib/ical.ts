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

/** UTC-midnight anchor for a calendar date (used for day arithmetic). */
function dateAnchor(y: number, mo: number, d: number): number {
  return Date.UTC(y, mo - 1, d);
}

/**
 * Expand a recurring event into concrete occurrences within [nowMs, horizonMs].
 * Fast-forwards to the visible window so long-running series (e.g. a weekly
 * block set up years ago) still produce current occurrences. Returns
 * start/end UTC ms pairs.
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
  const firstMs = toUtcMs(start);
  if (firstMs > horizonMs) return out;

  const startAnchor = dateAnchor(start.y, start.mo, start.d);
  const startWeekIdx = mondayIndex(start.y, start.mo, start.d);

  const consider = (y: number, mo: number, d: number): boolean => {
    // returns false to signal "past horizon, stop"
    const occMs = toUtcMsOnDate(start, y, mo, d);
    if (occMs > horizonMs) return false;
    if (rrule.untilMs != null && occMs > rrule.untilMs) return false;
    if (occMs + durationMs <= nowMs) return true; // in the past, keep scanning
    const key = `${y}-${mo}-${d}`;
    if (!exdates.has(key)) out.push({ startMs: occMs, endMs: occMs + durationMs });
    return true;
  };

  if (rrule.freq === "MONTHLY") {
    for (let k = 0; k < 1200; k++) {
      if (rrule.count != null && k >= rrule.count) break;
      const dt = new Date(
        Date.UTC(start.y, start.mo - 1 + k * rrule.interval, start.d)
      );
      const cont = consider(
        dt.getUTCFullYear(),
        dt.getUTCMonth() + 1,
        dt.getUTCDate()
      );
      if (!cont) break;
      if (out.length > MAX_OCCURRENCES) break;
    }
    return out;
  }

  if (rrule.freq === "DAILY" || rrule.freq === "WEEKLY") {
    const bydays =
      rrule.freq === "WEEKLY"
        ? (rrule.byday ?? [weekdayOf(start.y, start.mo, start.d)])
        : null;

    // With COUNT we must count from DTSTART; otherwise fast-forward to the window.
    let cursor: number;
    if (rrule.count != null) {
      cursor = startAnchor;
    } else {
      const windowStart = Math.max(startAnchor, nowMs - DAY_MS);
      // Snap window start back to a whole UTC day.
      cursor = Math.floor(windowStart / DAY_MS) * DAY_MS;
      if (cursor < startAnchor) cursor = startAnchor;
    }

    let matched = 0; // occurrences counted from DTSTART (for COUNT)
    for (let i = 0; i < 1500; i++) {
      const dt = new Date(cursor);
      const y = dt.getUTCFullYear();
      const mo = dt.getUTCMonth() + 1;
      const d = dt.getUTCDate();
      const daysSince = Math.round((cursor - startAnchor) / DAY_MS);

      if (daysSince >= 0) {
        let isOccurrence = false;
        if (rrule.freq === "DAILY") {
          isOccurrence = daysSince % rrule.interval === 0;
        } else {
          const wIdx = mondayIndex(y, mo, d) - startWeekIdx;
          isOccurrence =
            bydays!.includes(weekdayOf(y, mo, d)) &&
            wIdx % rrule.interval === 0;
        }
        if (isOccurrence) {
          if (rrule.count != null && matched >= rrule.count) break;
          const cont = consider(y, mo, d);
          matched += 1;
          if (!cont) break;
          if (out.length > MAX_OCCURRENCES) break;
        }
      }
      cursor += DAY_MS;
      if (toUtcMsOnDate(start, dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()) > horizonMs)
        break;
    }
    return out;
  }

  // Unknown frequency: emit the single base occurrence if in-window.
  if (firstMs + durationMs > nowMs && firstMs <= horizonMs) {
    out.push({ startMs: firstMs, endMs: firstMs + durationMs });
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
