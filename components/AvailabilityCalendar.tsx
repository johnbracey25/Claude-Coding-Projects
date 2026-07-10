"use client";

import { useState, useMemo } from "react";
import { computeOverlaps, type OverlapSlot } from "@/lib/overlaps";

export interface CalEvent {
  id: string;
  feedId: string;
  feedName: string;
  color: string;
  summary: string;
  starts_at: string;
  ends_at: string;
}

type View = "day" | "week" | "month";
const TZ = "America/New_York";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 86_400_000;
const PX_PER_HOUR = 46;

interface EParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  dow: number;
}

const _fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hour12: false,
});
function eParts(date: Date): EParts {
  const parts = _fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const dowIdx = WEEKDAYS.indexOf(map.weekday);
  let hh = Number(map.hour);
  if (hh === 24) hh = 0;
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    hh,
    mm: Number(map.minute),
    dow: dowIdx,
  };
}
function eMinutes(iso: string): number {
  const p = eParts(new Date(iso));
  return p.hh * 60 + p.mm;
}
function dayKey(p: { y: number; m: number; d: number }): string {
  return `${p.y}-${p.m}-${p.d}`;
}
function fmtTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })
    .replace(":00", "");
}
function fmtRange(startMs: number, endMs: number): string {
  return `${fmtTime(new Date(startMs).toISOString())}–${fmtTime(new Date(endMs).toISOString())}`;
}

/** A calendar date, moved by n days, as {y,m,d} in a UTC-noon frame. */
function shiftDate(p: { y: number; m: number; d: number }, days: number) {
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + days, 12));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export default function AvailabilityCalendar({
  events,
  feedCount,
}: {
  events: CalEvent[];
  feedCount: number;
}) {
  const today = useMemo(() => {
    const p = eParts(new Date());
    return { y: p.y, m: p.m, d: p.d };
  }, []);
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(today);

  // Visible date range (list of day cells) for the current view.
  const days = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") {
      const dow = eParts(new Date(Date.UTC(anchor.y, anchor.m - 1, anchor.d, 12))).dow;
      const sunday = shiftDate(anchor, -dow);
      return Array.from({ length: 7 }, (_, i) => shiftDate(sunday, i));
    }
    // month: 6 weeks starting on the Sunday on/before the 1st
    const first = { y: anchor.y, m: anchor.m, d: 1 };
    const firstDow = eParts(new Date(Date.UTC(first.y, first.m - 1, 1, 12))).dow;
    const gridStart = shiftDate(first, -firstDow);
    return Array.from({ length: 42 }, (_, i) => shiftDate(gridStart, i));
  }, [view, anchor]);

  const dayKeys = useMemo(() => new Set(days.map(dayKey)), [days]);

  // Events that start within the visible days.
  const visibleEvents = useMemo(
    () => events.filter((e) => dayKeys.has(dayKey(eParts(new Date(e.starts_at))))),
    [events, dayKeys]
  );

  // Overlap suggestions for the visible range.
  const slots = useMemo(
    () =>
      computeOverlaps(
        visibleEvents.map((e) => ({
          feedId: e.feedId,
          feedName: e.feedName,
          start: new Date(e.starts_at).getTime(),
          end: new Date(e.ends_at).getTime(),
        })),
        { minMinutes: 30 }
      ),
    [visibleEvents]
  );

  const fullSlots = useMemo(
    () => slots.filter((s) => s.count === feedCount && feedCount >= 1),
    [slots, feedCount]
  );
  const nearSlots = useMemo(
    () =>
      feedCount >= 2 ? slots.filter((s) => s.count === feedCount - 1) : [],
    [slots, feedCount]
  );

  function navigate(dir: -1 | 0 | 1) {
    if (dir === 0) return setAnchor(today);
    if (view === "day") return setAnchor((a) => shiftDate(a, dir));
    if (view === "week") return setAnchor((a) => shiftDate(a, dir * 7));
    setAnchor((a) => {
      const dt = new Date(Date.UTC(a.y, a.m - 1 + dir, 1, 12));
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: 1 };
    });
  }

  function jumpToDay(startMs: number) {
    const p = eParts(new Date(startMs));
    setAnchor({ y: p.y, m: p.m, d: p.d });
    setView("day");
  }

  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return new Date(Date.UTC(anchor.y, anchor.m - 1, anchor.d, 12)).toLocaleDateString(
        "en-US",
        { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }
      );
    }
    if (view === "week") {
      const a = days[0];
      const b = days[6];
      const f = (p: { y: number; m: number; d: number }, withYear = false) =>
        new Date(Date.UTC(p.y, p.m - 1, p.d, 12)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: withYear ? "numeric" : undefined,
          timeZone: "UTC",
        });
      return `${f(a)} – ${f(b, true)}`;
    }
    return new Date(Date.UTC(anchor.y, anchor.m - 1, 1, 12)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }, [view, anchor, days]);

  const feedNames = useMemo(
    () => Array.from(new Set(events.map((e) => e.feedName))),
    [events]
  );
  const colorByFeed = useMemo(() => {
    const m: Record<string, string> = {};
    for (const e of events) m[e.feedName] = e.color;
    return m;
  }, [events]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
                view === v
                  ? "bg-brand text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <h2 className="mr-1 text-base font-semibold text-slate-900">
            {rangeLabel}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            onClick={() => navigate(0)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <SuggestionsPanel
        feedCount={feedCount}
        fullSlots={fullSlots}
        nearSlots={nearSlots}
        onPick={jumpToDay}
      />

      {/* Calendar body */}
      <div className="mt-4">
        {view === "month" ? (
          <MonthGrid
            days={days}
            anchorMonth={anchor.m}
            today={today}
            events={visibleEvents}
            fullSlots={fullSlots}
          />
        ) : (
          <TimeGrid
            days={days}
            today={today}
            events={visibleEvents}
            fullSlots={fullSlots}
          />
        )}
      </div>

      {/* Legend */}
      {feedNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4">
          {feedNames.map((name) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorByFeed[name] }}
              />
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionsPanel({
  feedCount,
  fullSlots,
  nearSlots,
  onPick,
}: {
  feedCount: number;
  fullSlots: OverlapSlot[];
  nearSlots: OverlapSlot[];
  onPick: (startMs: number) => void;
}) {
  if (feedCount === 0) return null;
  const hasAny = fullSlots.length > 0 || nearSlots.length > 0;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Suggested slots{" "}
          <span className="font-normal text-slate-400">
            (in the current view)
          </span>
        </h3>
      </div>
      {!hasAny ? (
        <p className="mt-2 text-sm text-slate-500">
          No overlapping availability of 30+ minutes in this range. Try a wider
          view or a different week.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {fullSlots.length > 0 && (
            <SlotTier
              label={`Everyone free (${feedCount}/${feedCount})`}
              tone="full"
              slots={fullSlots}
              feedCount={feedCount}
              onPick={onPick}
            />
          )}
          {nearSlots.length > 0 && (
            <SlotTier
              label={`Almost everyone (${feedCount - 1}/${feedCount})`}
              tone="near"
              slots={nearSlots}
              feedCount={feedCount}
              onPick={onPick}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SlotTier({
  label,
  tone,
  slots,
  feedCount,
  onPick,
}: {
  label: string;
  tone: "full" | "near";
  slots: OverlapSlot[];
  feedCount: number;
  onPick: (startMs: number) => void;
}) {
  const sorted = [...slots].sort((a, b) => a.start - b.start).slice(0, 12);
  const badge =
    tone === "full"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";
  const dot = tone === "full" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {sorted.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.start)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-brand hover:bg-white"
            title={`Available: ${s.feedNames.join(", ")}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-800">
                {new Date(s.start).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  timeZone: TZ,
                })}
              </span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge}`}
              >
                {s.count}/{feedCount}
              </span>
            </div>
            <div className="mt-0.5 text-slate-600">{fmtRange(s.start, s.end)}</div>
            <div className="mt-0.5 truncate text-slate-400">
              {s.feedNames.join(", ")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Month grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  days,
  anchorMonth,
  today,
  events,
  fullSlots,
}: {
  days: { y: number; m: number; d: number }[];
  anchorMonth: number;
  today: { y: number; m: number; d: number };
  events: CalEvent[];
  fullSlots: OverlapSlot[];
}) {
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      const k = dayKey(eParts(new Date(e.starts_at)));
      (map[k] ??= []).push(e);
    }
    for (const k of Object.keys(map))
      map[k].sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    return map;
  }, [events]);

  const fullDayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const slot of fullSlots) s.add(dayKey(eParts(new Date(slot.start))));
    return s;
  }, [fullSlots]);

  return (
    <div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-lg border border-slate-200 bg-slate-200 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-slate-50 py-2 text-xs font-medium text-slate-500">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-lg border-x border-b border-slate-200 bg-slate-200">
        {days.map((c) => {
          const key = dayKey(c);
          const dayEvents = eventsByDay[key] ?? [];
          const inMonth = c.m === anchorMonth;
          const isToday = c.y === today.y && c.m === today.m && c.d === today.d;
          const shown = dayEvents.slice(0, 3);
          const extra = dayEvents.length - shown.length;
          return (
            <div
              key={key}
              className={`min-h-[92px] p-1.5 ${
                inMonth ? "bg-white" : "bg-slate-50/60"
              } ${isToday ? "ring-1 ring-inset ring-brand" : ""}`}
            >
              <div className="flex items-center justify-between">
                {fullDayKeys.has(key) ? (
                  <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-700">
                    all free
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${
                    isToday
                      ? "font-bold text-brand-dark"
                      : inMonth
                        ? "text-slate-500"
                        : "text-slate-300"
                  }`}
                >
                  {c.d}
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {shown.map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white"
                    style={{ backgroundColor: e.color }}
                    title={`${e.feedName}: ${e.summary || "Available"}\n${fmtTime(e.starts_at)}–${fmtTime(e.ends_at)}`}
                  >
                    <span className="font-medium">{fmtTime(e.starts_at)}</span>{" "}
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
    </div>
  );
}

// ── Day / Week time grid ─────────────────────────────────────────────────────

interface Placed {
  e: CalEvent;
  topMin: number;
  botMin: number;
  lane: number;
  lanes: number;
}

function layoutDay(
  dayEvents: CalEvent[],
  hourStart: number,
  hourEnd: number
): Placed[] {
  const items = dayEvents
    .map((e) => {
      let top = eMinutes(e.starts_at);
      let bot = eMinutes(e.ends_at);
      if (bot <= top) bot = hourEnd * 60; // crossed midnight → clamp to bottom
      top = Math.max(top, hourStart * 60);
      bot = Math.min(bot, hourEnd * 60);
      return { e, topMin: top, botMin: Math.max(bot, top + 15) };
    })
    .sort((a, b) => a.topMin - b.topMin);

  const placed: Placed[] = [];
  let cluster: (typeof items)[number][] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const laneEnds: number[] = [];
    const laneOf: number[] = [];
    for (const it of cluster) {
      let lane = laneEnds.findIndex((end) => it.topMin >= end);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.botMin);
      } else {
        laneEnds[lane] = it.botMin;
      }
      laneOf.push(lane);
    }
    const lanes = laneEnds.length;
    cluster.forEach((it, i) =>
      placed.push({ ...it, lane: laneOf[i], lanes })
    );
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const it of items) {
    if (cluster.length && it.topMin >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.botMin);
  }
  if (cluster.length) flush();
  return placed;
}

function TimeGrid({
  days,
  today,
  events,
  fullSlots,
}: {
  days: { y: number; m: number; d: number }[];
  today: { y: number; m: number; d: number };
  events: CalEvent[];
  fullSlots: OverlapSlot[];
}) {
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const e of events) {
      const k = dayKey(eParts(new Date(e.starts_at)));
      (map[k] ??= []).push(e);
    }
    return map;
  }, [events]);

  // Dynamic hour window from the visible events (clamped, sane default).
  const [hourStart, hourEnd] = useMemo(() => {
    let min = 8 * 60;
    let max = 18 * 60;
    for (const e of events) {
      min = Math.min(min, eMinutes(e.starts_at));
      const end = eMinutes(e.ends_at);
      if (end > eMinutes(e.starts_at)) max = Math.max(max, end);
    }
    const hs = Math.max(6, Math.floor(min / 60));
    const he = Math.min(21, Math.ceil(max / 60));
    return [hs, Math.max(he, hs + 4)];
  }, [events]);

  const hours = hourEnd - hourStart;
  const gridHeight = hours * PX_PER_HOUR;
  const hourList = Array.from({ length: hours + 1 }, (_, i) => hourStart + i);

  const slotsByDay = useMemo(() => {
    const map: Record<string, OverlapSlot[]> = {};
    for (const s of fullSlots) {
      const k = dayKey(eParts(new Date(s.start)));
      (map[k] ??= []).push(s);
    }
    return map;
  }, [fullSlots]);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(120px, 1fr))` }}
      >
        {/* Header row */}
        <div className="border-b border-slate-200" />
        {days.map((d) => {
          const isToday = d.y === today.y && d.m === today.m && d.d === today.d;
          const label = new Date(Date.UTC(d.y, d.m - 1, d.d, 12)).toLocaleDateString(
            "en-US",
            { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }
          );
          return (
            <div
              key={dayKey(d)}
              className={`border-b border-l border-slate-200 px-2 py-1.5 text-center text-xs font-medium ${
                isToday ? "bg-brand/5 text-brand-dark" : "text-slate-500"
              }`}
            >
              {label}
            </div>
          );
        })}

        {/* Hour gutter */}
        <div className="relative" style={{ height: gridHeight }}>
          {hourList.map((h, i) => (
            <div
              key={h}
              className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400"
              style={{ top: i * PX_PER_HOUR }}
            >
              {h === 0 || h === 24
                ? "12a"
                : h < 12
                  ? `${h}a`
                  : h === 12
                    ? "12p"
                    : `${h - 12}p`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const key = dayKey(d);
          const placed = layoutDay(eventsByDay[key] ?? [], hourStart, hourEnd);
          const daySlots = slotsByDay[key] ?? [];
          return (
            <div
              key={key}
              className="relative border-l border-slate-200"
              style={{ height: gridHeight }}
            >
              {/* Hour lines */}
              {hourList.slice(0, -1).map((h, i) => (
                <div
                  key={h}
                  className="absolute inset-x-0 border-b border-slate-100"
                  style={{ top: (i + 1) * PX_PER_HOUR }}
                />
              ))}
              {/* Full-overlap highlight bands */}
              {daySlots.map((s, i) => {
                const top = ((eMinutes(new Date(s.start).toISOString()) - hourStart * 60) / 60) * PX_PER_HOUR;
                const bottomMin = Math.min(
                  eMinutes(new Date(s.end).toISOString()) || hourEnd * 60,
                  hourEnd * 60
                );
                const h = Math.max(
                  ((bottomMin - hourStart * 60) / 60) * PX_PER_HOUR - top,
                  6
                );
                return (
                  <div
                    key={`slot-${i}`}
                    className="absolute inset-x-0 bg-emerald-200/40"
                    style={{ top: Math.max(top, 0), height: h }}
                    title="Everyone free"
                  />
                );
              })}
              {/* Events */}
              {placed.map((p) => {
                const top = ((p.topMin - hourStart * 60) / 60) * PX_PER_HOUR;
                const height = Math.max(
                  ((p.botMin - p.topMin) / 60) * PX_PER_HOUR - 2,
                  14
                );
                const widthPct = 100 / p.lanes;
                return (
                  <div
                    key={p.e.id}
                    className="absolute overflow-hidden rounded px-1 py-0.5 text-[10px] leading-tight text-white shadow-sm"
                    style={{
                      top,
                      height,
                      left: `calc(${p.lane * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: p.e.color,
                    }}
                    title={`${p.e.feedName}: ${p.e.summary || "Available"}\n${fmtTime(p.e.starts_at)}–${fmtTime(p.e.ends_at)}`}
                  >
                    <span className="font-semibold">{fmtTime(p.e.starts_at)}</span>{" "}
                    {p.e.summary || p.e.feedName}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
