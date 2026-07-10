import Link from "next/link";
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Getting Started · Eve Research",
  description:
    "How to get set up with Eve Research: your login, two-factor security, and sharing your availability calendar.",
  alternates: { canonical: "https://eve-research.com/getting-started" },
};

const PHONE_DISPLAY = "(770) 304-6410";
const PHONE_TEL = "+17703046410";

function StepCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand font-serif text-lg font-bold text-white">
          {n}
        </span>
        <h2 className="font-serif text-xl font-semibold text-brand-dark">
          {title}
        </h2>
      </div>
      <div className="mt-4 space-y-3 leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

function TextJohnButton() {
  return (
    <a
      href={`sms:${PHONE_TEL}`}
      className="inline-flex items-center gap-2 rounded-lg bg-sage px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-dark"
    >
      Text John · {PHONE_DISPLAY}
    </a>
  );
}

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-[#f6f4ee] text-slate-700">
      <PublicHeader />

      <main className="mx-auto max-w-2xl px-5">
        {/* Hero */}
        <section className="pt-12 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="mx-auto h-20 w-20 rounded-2xl object-contain shadow-sm"
          />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-sage-dark">
            Welcome to the team
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-brand-dark">
            Getting started
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            A quick, three-step setup to get you into the Eve Research system and
            your availability synced. It takes about five minutes. If you get
            stuck on anything, just text John.
          </p>
          <div className="mt-5 flex justify-center">
            <TextJohnButton />
          </div>
        </section>

        {/* Steps */}
        <div className="mt-10 space-y-5 pb-4">
          <StepCard n={1} title="Get your login">
            <p>
              Text John at{" "}
              <a
                href={`sms:${PHONE_TEL}`}
                className="font-semibold text-brand-dark underline"
              >
                {PHONE_DISPLAY}
              </a>{" "}
              and he&apos;ll set you up. You&apos;ll get back:
            </p>
            <ul className="ml-1 space-y-1.5">
              <li className="flex gap-2">
                <span className="text-sage-dark">•</span>
                <span>
                  A <strong>username</strong> (your email address), and
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-sage-dark">•</span>
                <span>
                  A <strong>temporary password</strong>.
                </span>
              </li>
            </ul>
            <p>
              You can keep that password or change it — to change it, use the{" "}
              <span className="font-medium">Forgot password?</span> link on the
              sign-in page and set your own.
            </p>
          </StepCard>

          <StepCard n={2} title="Sign in & turn on two-factor security">
            <p>
              Go to{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-dark underline"
              >
                eve-research.com/login
              </Link>{" "}
              and sign in with your email and password.
            </p>
            <p>
              Because we handle participant information, everyone turns on
              two-factor authentication (2FA) — a second code at sign-in so no one
              else can get into your account. Here&apos;s how:
            </p>
            <ol className="ml-1 space-y-2">
              <li className="flex gap-3">
                <span className="font-semibold text-sage-dark">1.</span>
                <span>
                  On your phone, install a free authenticator app —{" "}
                  <strong>Google Authenticator</strong>,{" "}
                  <strong>Microsoft Authenticator</strong>, or{" "}
                  <strong>Authy</strong> all work.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-sage-dark">2.</span>
                <span>
                  Once signed in, click <strong>Settings</strong> in the top menu
                  to open <strong>Two-factor authentication</strong>, then click{" "}
                  <strong>Set up 2FA</strong>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-sage-dark">3.</span>
                <span>
                  In your authenticator app, tap the <strong>+</strong> to add an
                  account and <strong>scan the QR code</strong> shown on screen.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-sage-dark">4.</span>
                <span>
                  The app will show a <strong>6-digit code</strong>. Type it in
                  and click <strong>Confirm setup</strong>. That&apos;s it.
                </span>
              </li>
            </ol>
            <p className="text-sm text-slate-500">
              From then on, you&apos;ll open your authenticator app for a fresh
              6-digit code each time you sign in.
            </p>
          </StepCard>

          <StepCard n={3} title="Share your availability calendar">
            <p>
              We schedule participants around when you&apos;re available. You keep
              your availability on your own calendar (Google or Apple), share a
              link, and John connects it — <strong>he&apos;ll do the syncing and
              testing for you</strong>. Once you have your link,{" "}
              <a
                href={`sms:${PHONE_TEL}`}
                className="font-semibold text-brand-dark underline"
              >
                text it to John
              </a>
              .
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">
                Important: share the right calendar.
              </p>
              <p className="mt-1">
                If you keep more than one calendar, make sure you grab the link
                for the exact calendar where your availability lives. Sharing the
                wrong one means we see the wrong events — this tripped us up once
                and took a while to untangle. When in doubt, tell John which
                calendar it is.
              </p>
            </div>

            <div>
              <p className="font-semibold text-brand-dark">On an iPhone or iPad (Apple Calendar)</p>
              <ol className="ml-1 mt-2 space-y-1.5">
                <li className="flex gap-3">
                  <span className="font-semibold text-sage-dark">1.</span>
                  <span>
                    Open the <strong>Calendar</strong> app and tap{" "}
                    <strong>Calendars</strong> at the bottom.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-sage-dark">2.</span>
                  <span>
                    Tap the <strong>ⓘ</strong> next to the calendar you use for
                    availability.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-sage-dark">3.</span>
                  <span>
                    Turn on <strong>Public Calendar</strong>, tap{" "}
                    <strong>Share Link</strong>, and copy it.
                  </span>
                </li>
              </ol>
            </div>

            <div>
              <p className="font-semibold text-brand-dark">On a computer (Google Calendar)</p>
              <ol className="ml-1 mt-2 space-y-1.5">
                <li className="flex gap-3">
                  <span className="font-semibold text-sage-dark">1.</span>
                  <span>
                    Open{" "}
                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-dark underline"
                    >
                      Google Calendar
                    </a>
                    . On the left, hover the calendar you use, click the{" "}
                    <strong>⋮</strong>, and choose{" "}
                    <strong>Settings and sharing</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-sage-dark">2.</span>
                  <span>
                    Scroll to <strong>Integrate calendar</strong> and copy the{" "}
                    <strong>Secret address in iCal format</strong> (it ends
                    in <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.ics</code>).
                  </span>
                </li>
              </ol>
            </div>

            <p>
              Then just text that link to John at{" "}
              <a
                href={`sms:${PHONE_TEL}`}
                className="font-semibold text-brand-dark underline"
              >
                {PHONE_DISPLAY}
              </a>{" "}
              and he&apos;ll take it from there.
            </p>
          </StepCard>
        </div>

        {/* Closing */}
        <section className="mt-6 rounded-2xl bg-sage/10 p-6 text-center ring-1 ring-sage/20">
          <h3 className="font-serif text-xl font-semibold text-brand-dark">
            Stuck on anything?
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            No question is too small. Text John and he&apos;ll walk you through it.
          </p>
          <div className="mt-4 flex justify-center">
            <TextJohnButton />
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
