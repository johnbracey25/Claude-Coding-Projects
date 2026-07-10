/**
 * General availability preferences captured when a candidate says they're
 * interested. This narrows down when staff should call to schedule — it is NOT
 * used for automated booking.
 */

export const TIME_OPTIONS = [
  { key: "morning", label: "Morning", hint: "8–11am" },
  { key: "midday", label: "Mid-day", hint: "11am–1pm" },
  { key: "afternoon", label: "Afternoon", hint: "1–3pm" },
  { key: "late_afternoon", label: "Late afternoon", hint: "3–5pm" },
] as const;

export const DAY_OPTIONS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
] as const;

export const TIME_KEYS = TIME_OPTIONS.map((t) => t.key) as readonly string[];
export const DAY_KEYS = DAY_OPTIONS.map((d) => d.key) as readonly string[];

export interface AvailabilityPref {
  times: string[];
  days: string[];
}

/** Keep only recognized keys (defends the DB against arbitrary client input). */
export function sanitizeAvailability(input: unknown): AvailabilityPref | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as { times?: unknown; days?: unknown };
  const times = Array.isArray(obj.times)
    ? obj.times.filter((t): t is string => typeof t === "string" && TIME_KEYS.includes(t))
    : [];
  const days = Array.isArray(obj.days)
    ? obj.days.filter((d): d is string => typeof d === "string" && DAY_KEYS.includes(d))
    : [];
  if (times.length === 0 && days.length === 0) return null;
  return { times, days };
}

/** Human-readable summary for staff, e.g. "Mon, Wed, Fri · Morning, Afternoon". */
export function formatAvailability(
  pref: AvailabilityPref | null | undefined
): string {
  if (!pref) return "";
  const days = (pref.days ?? []).map(
    (k) => DAY_OPTIONS.find((d) => d.key === k)?.short ?? k
  );
  const times = (pref.times ?? []).map(
    (k) => TIME_OPTIONS.find((t) => t.key === k)?.label ?? k
  );
  const parts: string[] = [];
  if (days.length) parts.push(days.join(", "));
  if (times.length) parts.push(times.join(", "));
  return parts.join(" · ");
}
