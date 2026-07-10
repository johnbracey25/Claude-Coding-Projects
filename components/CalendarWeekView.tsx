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

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  });
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1.toLocaleString("en-US", { timeZone: TZ }));
  const d2 = new Date(date2.toLocaleString("en-US", { timeZone: TZ }));
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export default function CalendarWeekView({
  events,
}: {
  events: CalEventDisplay[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const now = new Date();
    const base = startOfWeek(now);
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEventDisplay[]> = {};
    for (const day of days) {
      const key = day.toISOString();
      map[key] = events.filter((e) => {
        const start = new Date(e.starts_at);
        const end = new Date(e.ends_at);
        return (
          isSameDay(start, day) ||
          isSameDay(end, day) ||
          (start < day && end > addDays(day, 1))
        );
      });
    }
    return map;
  }, [events, days]);

  const weekLabel = `${days[0].toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: TZ,
  })} - ${days[6].toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  })}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{weekLabel}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        {days.map((day) => {
          const key = day.toISOString();
          const dayEvents = eventsByDay[key] ?? [];
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`min-h-[140px] bg-white p-2 ${
                today ? "bg-brand/5" : ""
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  today ? "text-brand-dark font-bold" : "text-slate-500"
                }`}
              >
                {formatDayHeader(day)}
              </p>
              <div className="mt-1 space-y-1">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="rounded px-1.5 py-1 text-xs text-white"
                    style={{ backgroundColor: e.color }}
                    title={`${e.feedName}: ${e.summary}\n${formatTimeShort(e.starts_at)} - ${formatTimeShort(e.ends_at)}`}
                  >
                    <span className="font-medium">
                      {formatTimeShort(e.starts_at)}
                    </span>{" "}
                    <span className="truncate opacity-90">{e.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4">
          {Array.from(new Set(events.map((e) => e.feedName))).map((name) => {
            const e = events.find((ev) => ev.feedName === name);
            return (
              <div key={name} className="flex items-center gap-1.5 text-xs text-slate-600">
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
