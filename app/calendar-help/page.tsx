import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Your Calendar",
};

const GOOGLE_STEPS = [
  "Open Google Calendar on a computer (calendar.google.com).",
  'In the left sidebar, find the calendar you want to share. Click the three dots next to its name.',
  'Click "Settings and sharing."',
  'Scroll down to "Secret address in iCal format."',
  "Click the copy button next to the URL.",
  "Send the URL to Eve Research (text or email is fine).",
];

const APPLE_STEPS = [
  "On a Mac, open the Calendar app. (You can also use icloud.com/calendar in a browser.)",
  "In the left sidebar, right-click the calendar you want to share.",
  'Click "Share Calendar..."',
  'Check the box for "Public Calendar."',
  "A URL will appear. Copy it.",
  "Send the URL to Eve Research (text or email is fine).",
];

export default function CalendarHelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4ee] text-slate-700">
      <header className="border-b border-slate-200/60 bg-[#f6f4ee]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/eve-icon.png"
              alt=""
              className="h-9 w-9 object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl font-bold tracking-tight text-brand-dark">
                Eve
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-dark">
                Research
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-10">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold text-brand-dark">
              Connect your calendar
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Follow the steps below for your calendar type, then send the link
              to Eve Research. We only read your events &mdash; we cannot change
              or add anything to your calendar.
            </p>
          </div>

          {/* Google */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                G
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-sage-dark">
                Google Calendar
              </h2>
            </div>
            <ol className="mt-4 space-y-3">
              {GOOGLE_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Apple */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                A
              </span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-sage-dark">
                Apple Calendar
              </h2>
            </div>
            <ol className="mt-4 space-y-3">
              {APPLE_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            This is a read-only link. We can only view your calendar, not make
            changes to it.
          </p>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200/60 py-10 text-center">
        <p className="font-serif text-lg font-semibold text-brand-dark">
          Eve Research
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.2em] text-sage-dark">
          Focused on Tomorrow&apos;s Vision
        </p>
        <p className="mx-auto mt-4 max-w-md px-6 text-xs text-slate-400">
          Athens, Georgia
        </p>
      </footer>
    </div>
  );
}
