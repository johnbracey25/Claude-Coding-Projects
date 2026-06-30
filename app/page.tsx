import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-brand-dark">
          Eve Research
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Recruiting &amp; scheduling platform
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand px-6 py-3 font-medium text-white transition hover:bg-brand-dark"
        >
          Staff sign in
        </Link>
      </div>

      <p className="max-w-md text-sm text-slate-400">
        This is the internal staff portal. Participant booking links are sent by
        email or text and open directly to a scheduling page.
      </p>
    </main>
  );
}
