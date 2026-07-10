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
        <div className="text-right text-xs">
          {result.feeds.length === 0 ? (
            <p className="text-slate-500">No calendars connected yet.</p>
          ) : failed.length === 0 ? (
            <p className="text-emerald-600">
              Synced {result.feeds.length} calendar
              {result.feeds.length === 1 ? "" : "s"} · {totalImported} availability
              block{totalImported === 1 ? "" : "s"} found.
            </p>
          ) : (
            <div className="text-rose-600">
              <p>
                {failed.length} calendar{failed.length === 1 ? "" : "s"} had a
                problem:
              </p>
              <ul className="mt-0.5">
                {failed.map((f) => (
                  <li key={f.feedId}>
                    {f.name}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
