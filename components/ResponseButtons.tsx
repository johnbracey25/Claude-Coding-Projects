"use client";

import { useState } from "react";
import { TIME_OPTIONS, DAY_OPTIONS } from "@/lib/availability";

type Step = "choice" | "availability";
type Done = "interested" | "declined" | null;

export default function ResponseButtons({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("choice");
  const [done, setDone] = useState<Done>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);

  function toggle(list: string[], setList: (v: string[]) => void, key: string) {
    setList(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  }

  async function submit(choice: "interested" | "declined") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/public/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          choice,
          availability: choice === "interested" ? { times, days } : undefined,
        }),
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
        <p className="font-semibold">You&apos;re all set — thank you! 🎉</p>
        <p className="mt-1 text-sm">
          Someone from Eve Research will call you soon to find a visit time that
          works for you. No need to do anything else right now.
        </p>
      </div>
    );
  }
  if (done === "declined") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center text-slate-600">
        <p>
          No problem. Thanks for letting us know — we won&apos;t reach out about
          this study.
        </p>
      </div>
    );
  }

  // Step 2: general availability (helps us know when to call).
  if (step === "availability") {
    return (
      <div>
        <p className="text-sm text-slate-600">
          Great! To help us find a good time, when are you generally available?
          Pick anything that applies — we&apos;ll call to confirm the exact time.
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Best days
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggle(days, setDays, d.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  days.includes(d.key)
                    ? "border-brand bg-brand text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Best times of day
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => toggle(times, setTimes, t.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  times.includes(t.key)
                    ? "border-brand bg-brand text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
                <span
                  className={`ml-1 text-xs ${
                    times.includes(t.key) ? "text-white/70" : "text-slate-400"
                  }`}
                >
                  {t.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => submit("interested")}
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Sending…" : "Submit & we'll call you"}
        </button>
        <button
          onClick={() => setStep("choice")}
          disabled={busy}
          className="mt-2 w-full text-center text-sm text-slate-500 hover:underline disabled:opacity-50"
        >
          Back
        </button>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }

  // Step 1: interested / not.
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setStep("availability")}
          disabled={busy}
          className="flex-1 rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Yes, I&apos;m interested
        </button>
        <button
          onClick={() => submit("declined")}
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
