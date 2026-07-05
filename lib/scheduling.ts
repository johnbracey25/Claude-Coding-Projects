import type { VisitDef } from "./types";

/**
 * Pure slot-computation engine. Given open availability windows, already-taken
 * times (busy), and a visit duration, it produces the bookable start times.
 * The multi-visit gap rules are applied by constraining the allowed date range
 * for later visits (see gapRange). Kept free of I/O so it can be unit-tested and
 * reused by both the public booking API and staff tools.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export interface TimeRange {
  starts_at: string; // ISO
  ends_at: string; // ISO
}

export interface ComputeSlotsParams {
  windows: TimeRange[];
  busy: TimeRange[];
  durationMin: number;
  stepMin?: number;
  /** Earliest allowed start (e.g. now, or prior visit + min gap). */
  rangeStart?: Date;
  /** Latest allowed end (e.g. study end, or prior visit + max gap). */
  rangeEnd?: Date;
  now?: Date;
  maxSlots?: number;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

/** Returns bookable slot start times (ISO strings), sorted ascending. */
export function computeSlots(params: ComputeSlotsParams): string[] {
  const {
    windows,
    busy,
    durationMin,
    stepMin = 30,
    rangeStart,
    rangeEnd,
    now = new Date(),
    maxSlots = 500,
  } = params;

  const durMs = durationMin * MINUTE;
  const stepMs = stepMin * MINUTE;
  if (durMs <= 0 || stepMs <= 0) return [];

  const lower = Math.max(now.getTime(), rangeStart?.getTime() ?? -Infinity);
  const upper = rangeEnd?.getTime() ?? Infinity;

  const busyMs = busy.map((b) => ({
    s: new Date(b.starts_at).getTime(),
    e: new Date(b.ends_at).getTime(),
  }));

  const slots: number[] = [];
  for (const w of windows) {
    const wStart = new Date(w.starts_at).getTime();
    const wEnd = new Date(w.ends_at).getTime();
    if (!Number.isFinite(wStart) || !Number.isFinite(wEnd)) continue;

    const effectiveEnd = Math.min(wEnd, upper);
    const minStart = Math.max(wStart, lower);
    if (minStart + durMs > effectiveEnd) continue;

    // Align candidate starts to the window's own start so times stay tidy.
    const k = Math.max(0, Math.ceil((minStart - wStart) / stepMs));
    let c = wStart + k * stepMs;

    while (c + durMs <= effectiveEnd) {
      const conflict = busyMs.some((b) => overlaps(c, c + durMs, b.s, b.e));
      if (!conflict) slots.push(c);
      if (slots.length >= maxSlots * 4) break; // safety
      c += stepMs;
    }
  }

  const unique = Array.from(new Set(slots)).sort((a, b) => a - b);
  return unique.slice(0, maxSlots).map((ms) => new Date(ms).toISOString());
}

/**
 * Allowed date range for a follow-up visit, from the prior visit's start plus
 * the visit's min/max gap in days. Visit 1 (no prior) returns an open range.
 */
export function gapRange(
  priorVisitStartIso: string | null,
  visit: VisitDef
): { rangeStart?: Date; rangeEnd?: Date } {
  if (!priorVisitStartIso) return {};
  const prior = new Date(priorVisitStartIso).getTime();
  const min = visit.min_gap_days ?? 0;
  const max = visit.max_gap_days ?? min;
  return {
    rangeStart: new Date(prior + min * DAY),
    // Include the whole max day.
    rangeEnd: new Date(prior + (max + 1) * DAY),
  };
}
