"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runSync } from "@/app/calendar/actions";
import type { SyncResult } from "@/lib/calendar-sync";

export default function SyncButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  function sync() {
    setResult(null);
    startTransition(async () => {
      const r = await runSync();
      setResult(r);
      router.refresh();
    });
  }

  const totalImported = result?.imported ?? 0;
  const failed = result?.feeds.filter((f) => !f.ok) ?? [];
  // Feeds that synced fine but matched no availability — the common confusing case.
  const empty =
    result?.feeds.filter((f) => f.ok && f.imported === 0) ?? [];

  return (
    <div className={compact ? "" : "flex flex-col items-end gap-2"}>
      <button
        onClick={sync}
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Syncing…" : "Sync now"}
      </button>

      {result && !pending && (
        <div className="max-w-md text-right text-xs">
          {result.feeds.length === 0 ? (
            <p className="text-slate-500">No calendars connected yet.</p>
          ) : (
            <>
              {failed.length === 0 && empty.length === 0 && (
                <p className="text-emerald-600">
                  Synced {result.feeds.length} calendar
                  {result.feeds.length === 1 ? "" : "s"} · {totalImported}{" "}
                  availability block{totalImported === 1 ? "" : "s"} found.
                </p>
              )}

              {failed.map((f) => (
                <p key={f.feedId} className="text-rose-600">
                  {f.name}: {f.error}
                </p>
              ))}

              {empty.map((f) => (
                <div
                  key={f.feedId}
                  className="mt-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-left text-amber-800"
                >
                  <p className="font-medium">
                    {f.name}: parsed {f.parsedCount ?? 0} event
                    {(f.parsedCount ?? 0) === 1 ? "" : "s"}, 0 matched
                    {f.keyword ? ` keyword “${f.keyword}”` : ""}.
                  </p>
                  {(f.parsedCount ?? 0) === 0 ? (
                    <p className="mt-0.5">
                      No upcoming events were read from this feed. The calendar
                      may have no future events, or its share link may point to a
                      different calendar.
                    </p>
                  ) : f.keyword ? (
                    <p className="mt-0.5">
                      This calendar has events, but none are titled
                      &ldquo;{f.keyword}&rdquo;. Make sure the shared calendar is
                      the one with the availability blocks, and that the keyword
                      matches how those blocks are titled.
                    </p>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
