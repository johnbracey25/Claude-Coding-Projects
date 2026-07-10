"use client";

import { useState, useMemo } from "react";

interface CalEventDisplay {
  id: string;
  summary: string;
  starts_at: string;
  ends_at: string;
  color: string;
  feedName: string;
}

const TZ = "America/New_York";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Y/M/D of an instant, as seen in Eastern time. */
function easternYMD(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = Number(p.value);
  return { y: map.year, m: map.month, d: map.day };
}

function formatTimeShort(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    })
    .replace(":00", "");
}

export default function CalendarMonthView({
  events,
}: {
  events: CalEventDisplay[];
}) {
  // Anchor on the current month in Eastern time.
  const todayE = easternYMD(new Date());
  const [monthOffset, setMonthOffset] = useState(0);

  const { year, month } = useMemo(() => {
    const base = new Date(Date.UTC(todayE.y, todayE.m - 1 + monthOffset, 1));
    return { year: base.getUTCFullYear(), month: base.getUTCMonth() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset]);

  // Build a 6-week grid starting on the Sunday on/before the 1st.
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, month, 1));
    const startDow = first.getUTCDay(); // 0 = Sun
    const gridStart = new Date(Date.UTC(year, month, 1 - startDow));
    return Array.from({ length: 42 }, (_, i) => {
      const dt = new Date(gridStart);
      dt.setUTCDate(gridStart.getUTCDate() + i);
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    });
  }, [year, month]);

  // Group events by their Eastern calendar day.
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEventDisplay[]> = {};
    for (const e of events) {
      const { y, m, d } = easternYMD(new Date(e.starts_at));
      const key = `${y}-${m}-${d}`;
      (map[key] ??= []).push(e);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    }
    return map;
  }, [events]);

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  const feedNames = Array.from(new Set(events.map((e) => e.feedName)));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-t-lg border border-slate-200 bg-slate-200 text-center">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-slate-50 py-2 text-xs font-medium text-slate-500"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border-x border-b border-slate-200 bg-slate-200">
        {cells.map((c) => {
          const key = `${c.y}-${c.m}-${c.d}`;
          const dayEvents = eventsByDay[key] ?? [];
          const inMonth = c.m === month + 1;
          const isToday =
            c.y === todayE.y && c.m === todayE.m && c.d === todayE.d;
          const shown = dayEvents.slice(0, 3);
          const extra = dayEvents.length - shown.length;

          return (
            <div
              key={key}
              className={`min-h-[96px] p-1.5 ${
                inMonth ? "bg-white" : "bg-slate-50/60"
              } ${isToday ? "ring-1 ring-inset ring-brand" : ""}`}
            >
              <p
                className={`text-right text-xs ${
                  isToday
                    ? "font-bold text-brand-dark"
                    : inMonth
                      ? "text-slate-500"
                      : "text-slate-300"
                }`}
              >
                {c.d}
              </p>
              <div className="mt-0.5 space-y-0.5">
                {shown.map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                    style={{ backgroundColor: e.color }}
                    title={`${e.feedName}: ${e.summary || "Available"}\n${formatTimeShort(e.starts_at)}–${formatTimeShort(e.ends_at)}`}
                  >
                    <span className="font-medium">
                      {formatTimeShort(e.starts_at)}
                    </span>{" "}
                    {e.summary || "Available"}
                  </div>
                ))}
                {extra > 0 && (
                  <p className="px-1 text-[10px] text-slate-400">+{extra} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {feedNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4">
          {feedNames.map((name) => {
            const e = events.find((ev) => ev.feedName === name);
            return (
              <div
                key={name}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: e?.color }}
                />
                {name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
