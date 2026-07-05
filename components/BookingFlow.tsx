"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate, formatTime, formatDateTime } from "@/lib/format";

interface VisitInfo {
  index: number;
  name: string;
  duration_min: number;
}

interface Selection {
  visit_number: number;
  visit_name: string;
  starts_at: string;
  duration_min: number;
}

export default function BookingFlow({
  token,
  visits,
}: {
  token: string;
  visits: VisitInfo[];
}) {
  const [selected, setSelected] = useState<Selection[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = selected.length; // which visit we're picking (0-based)
  const current = visits[step];
  const reviewing = step >= visits.length;

  const loadSlots = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError(null);
    try {
      const after = step > 0 ? selected[step - 1].starts_at : "";
      const url = `/api/public/slots?token=${encodeURIComponent(token)}&visit=${step}${
        after ? `&after=${encodeURIComponent(after)}` : ""
      }`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load times.");
      setSlots(json.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load times.");
    } finally {
      setLoading(false);
    }
  }, [current, step, selected, token]);

  useEffect(() => {
    if (!reviewing) loadSlots();
  }, [reviewing, loadSlots]);

  function pick(slot: string) {
    if (!current) return;
    setSelected([
      ...selected,
      {
        visit_number: current.index + 1,
        visit_name: current.name,
        starts_at: slot,
        duration_min: current.duration_min,
      },
    ]);
    setSlots([]);
  }

  function back() {
    setSelected(selected.slice(0, -1));
    setError(null);
  }

  async function confirm() {
    setBooking(true);
    setError(null);
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, selections: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not book.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not book.");
      // A conflict likely means a slot was taken; send them back to re-pick.
      setSelected([]);
    } finally {
      setBooking(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-emerald-700">You&apos;re booked! 🎉</h2>
        <ul className="mt-4 space-y-1 text-slate-700">
          {selected.map((s, i) => (
            <li key={i}>
              <span className="font-medium">{s.visit_name}:</span>{" "}
              {formatDateTime(s.starts_at)}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          We&apos;ve sent a confirmation. See you then!
        </p>
      </div>
    );
  }

  // Group slots by day for readability.
  const byDay: Record<string, string[]> = {};
  for (const s of slots) {
    const day = formatDate(s);
    (byDay[day] ??= []).push(s);
  }

  return (
    <div>
      {/* Progress of chosen visits */}
      {selected.length > 0 && (
        <div className="mb-5 rounded-lg bg-slate-50 p-3 text-sm">
          {selected.map((s, i) => (
            <div key={i} className="text-slate-700">
              <span className="font-medium">{s.visit_name}:</span>{" "}
              {formatDateTime(s.starts_at)}
            </div>
          ))}
          <button onClick={back} className="mt-1 text-xs text-brand-dark hover:underline">
            ← Change last selection
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!reviewing ? (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Choose a time for {current.name}
            {visits.length > 1 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                (visit {step + 1} of {visits.length})
              </span>
            )}
          </h2>
          {loading ? (
            <p className="mt-4 text-slate-400">Loading times...</p>
          ) : slots.length === 0 ? (
            <p className="mt-4 text-slate-500">
              No available times right now. Please check back soon, or contact us.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {Object.entries(byDay).map(([day, times]) => (
                <div key={day}>
                  <p className="mb-2 text-sm font-medium text-slate-500">{day}</p>
                  <div className="flex flex-wrap gap-2">
                    {times.map((t) => (
                      <button
                        key={t}
                        onClick={() => pick(t)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-brand hover:bg-brand-light/10"
                      >
                        {formatTime(t)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-slate-900">
            Confirm your {selected.length > 1 ? "visits" : "visit"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please confirm the times below.
          </p>
          <button
            onClick={confirm}
            disabled={booking}
            className="mt-5 w-full rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {booking ? "Booking..." : "Confirm booking"}
          </button>
        </>
      )}
    </div>
  );
}
