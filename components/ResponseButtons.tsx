"use client";

import { useState } from "react";

export default function ResponseButtons({ token }: { token: string }) {
  const [done, setDone] = useState<"interested" | "declined" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(choice: "interested" | "declined") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, choice }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Something went wrong.");
      }
      setDone(choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done === "interested") {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-center text-emerald-800">
        <p className="font-semibold">Great — thank you! 🎉</p>
        <p className="mt-1 text-sm">
          We&apos;ll be in touch soon with the next steps and available times.
        </p>
      </div>
    );
  }
  if (done === "declined") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-600">
        <p>No problem — thanks for letting us know. We won&apos;t reach out about this study.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => respond("interested")}
          disabled={busy}
          className="flex-1 rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Yes, I&apos;m interested
        </button>
        <button
          onClick={() => respond("declined")}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Not right now
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
