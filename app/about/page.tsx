import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Eve Research & Dr. Lauren Hacker",
  description:
    "Learn about Dr. Lauren Hacker and Eve Research, and how our eye-research studies work.",
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT ME: replace the placeholder copy below with Lauren's real bio and the
// Eve Research description. Everything a visitor reads lives in this file.
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="mx-auto h-32 w-32 rounded-2xl object-contain"
        />
      </div>

      <section className="mt-8">
        <h1 className="text-2xl font-bold text-brand-dark">
          Dr. Lauren Hacker
        </h1>
        <p className="mt-3 leading-relaxed text-slate-700">
          Dr. Lauren Hacker leads the eye-research studies at Eve Research. She
          works with participants across the community to advance research in
          vision and eye health, and personally oversees each study from
          screening through scheduling.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          {/* EDIT: add credentials, focus area, years of experience, and a
              personal note here. */}
          She is committed to making research participation simple, respectful,
          and convenient for everyone who takes part.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-brand-dark">
          About Eve Research
        </h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          {/* EDIT: describe what Eve Research does and who it serves. */}
          Eve Research is an eye-research consulting practice that connects
          interested people with local vision and eye-health studies. When you
          join our list, we match you to studies you may qualify for and invite
          you to take part, with no obligation.
        </p>
      </section>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 text-center">
        <p className="text-slate-700">
          Interested in taking part in a study?
        </p>
        <Link
          href="/join"
          className="mt-3 inline-block rounded-lg bg-brand px-6 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          Join the research list
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Eve Research · Your information is kept private and used only to contact
        you about research opportunities.
      </p>
    </main>
  );
}
