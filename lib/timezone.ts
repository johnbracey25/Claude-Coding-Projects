/**
 * The business runs on US Eastern time only. Staff enter availability in Eastern
 * wall-clock; we convert to a true UTC instant for storage, and format back to
 * Eastern for display. This keeps booking times unambiguous across devices.
 */

export const APP_TZ = "America/New_York";

/** Timezone offset (ms) for APP_TZ at a given UTC instant. */
function tzOffsetMs(utcMs: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  const asIfUtc = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour % 24,
    map.minute,
    map.second
  );
  return asIfUtc - utcMs;
}

/**
 * Convert an Eastern wall-clock string ("YYYY-MM-DDTHH:mm" or with seconds) to a
 * UTC ISO instant, accounting for EST/EDT.
 */
export function easternToUtcIso(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m.map(Number);
  const guess = Date.UTC(y, mo - 1, d, hh, mm);
  const offset = tzOffsetMs(guess);
  return new Date(guess - offset).toISOString();
}

/** Start-of-day (00:00 Eastern) for a "YYYY-MM-DD" date, as UTC ISO. */
export function easternDateStartUtc(date: string): string | null {
  return easternToUtcIso(`${date}T00:00`);
}

/** End-of-day (23:59 Eastern) for a "YYYY-MM-DD" date, as UTC ISO. */
export function easternDateEndUtc(date: string): string | null {
  return easternToUtcIso(`${date}T23:59`);
}
