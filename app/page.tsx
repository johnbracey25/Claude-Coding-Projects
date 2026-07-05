import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="h-44 w-44 rounded-2xl object-contain"
        />
        <p className="mt-3 text-lg text-slate-600">
          Recruiting &amp; scheduling platform
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/join"
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
        >
          Join a research study
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Staff sign in
        </Link>
      </div>

      <p className="max-w-md text-sm text-slate-400">
        Interested in taking part in a study? Tap &ldquo;Join a research
        study.&rdquo; Staff use the sign-in to manage people and scheduling.
      </p>

      <Link href="/about" className="text-sm text-brand-dark hover:underline">
        About Dr. Lauren Hacker &amp; Eve Research
      </Link>
    </main>
  );
}
