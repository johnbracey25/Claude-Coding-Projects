"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Platform = "" | "google" | "apple";

const GOOGLE_STEPS = [
  "Open Google Calendar on a computer (calendar.google.com).",
  'In the left sidebar, find the calendar you want to share. Click the three dots next to its name.',
  'Click "Settings and sharing."',
  'Scroll down to "Secret address in iCal format."',
  "Click the copy button next to the URL.",
  "Paste it below.",
];

const APPLE_STEPS = [
  "On a Mac, open the Calendar app. (You can also use icloud.com/calendar in a browser.)",
  "In the left sidebar, right-click the calendar you want to share.",
  'Click "Share Calendar..."',
  'Check the box for "Public Calendar."',
  "A URL will appear. Copy it.",
  "Paste it below.",
];

const inputCls =
  "w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function ConnectCalendarForm() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";

  const [platform, setPlatform] = useState<Platform>("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = platform === "google" ? GOOGLE_STEPS : APPLE_STEPS;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!url.trim() || !url.startsWith("http")) {
      setError("Please paste a valid calendar URL starting with https://");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/public/connect-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), ics_url: url.trim(), code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4ee] px-5">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="h-8 w-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Calendar connected!
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Your calendar has been linked to Eve Research. Events will sync
            automatically every 15 minutes. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] px-5 py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="mx-auto h-16 w-16 rounded-xl object-contain"
          />
          <h1 className="mt-4 font-serif text-2xl font-bold text-brand-dark">
            Connect your calendar
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Link your calendar so Eve Research can see your availability.
            We only read your events. We cannot change or add anything to
            your calendar.
          </p>
        </div>

        {/* Step 1: Pick platform */}
        {!platform && (
          <div className="mt-8 space-y-3">
            <p className="text-center text-sm font-medium text-slate-700">
              What calendar do you use?
            </p>
            <button
              onClick={() => setPlatform("google")}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-brand hover:shadow"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                G
              </span>
              <div>
                <p className="font-medium text-slate-800">Google Calendar</p>
                <p className="text-xs text-slate-500">Gmail, Google Workspace</p>
              </div>
            </button>
            <button
              onClick={() => setPlatform("apple")}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-brand hover:shadow"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                A
              </span>
              <div>
                <p className="font-medium text-slate-800">Apple Calendar</p>
                <p className="text-xs text-slate-500">iCloud, Mac, iPhone</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Instructions + paste */}
        {platform && (
          <div className="mt-8">
            <button
              onClick={() => setPlatform("")}
              className="text-xs text-slate-400 hover:text-brand hover:underline"
            >
              Pick a different calendar
            </button>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-sage-dark">
                How to get your calendar link
              </h2>
              <ol className="mt-3 space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-dark">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Your name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Lauren, Lisa"
                  className={inputCls}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Calendar URL
                </span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="Paste the URL you copied here"
                  className={inputCls}
                />
                <span className="mt-1 block text-xs text-slate-400">
                  This is a read-only link. We can only view your calendar, not
                  make changes to it.
                </span>
              </label>

              {error && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? "Connecting..." : "Connect my calendar"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
