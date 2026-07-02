import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/config";
import ShareSignupLink from "@/components/ShareSignupLink";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Staff dashboard</h1>
      <p className="mt-1 text-slate-600">
        Eve Research recruiting &amp; scheduling.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Setup needed</p>
          <p className="mt-1">
            The database isn&apos;t connected yet. Copy{" "}
            <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> and add
            your Supabase project URL and keys to enable people, studies, and
            scheduling.
          </p>
        </div>
      )}

      <div className="mt-6">
        <ShareSignupLink />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DashboardCard
          title="People"
          desc="Your contact database. Import, search, and manage participants."
          href="/people"
          status="Phase 1"
        />
        <DashboardCard
          title="Studies"
          desc="Define studies, eligibility rules, and visit plans."
          href="/studies"
          status="Phase 2"
        />
        <DashboardCard
          title="Candidates"
          desc="Match eligible people and send invites."
          href="/candidates"
          status="Phase 2–3"
        />
        <DashboardCard
          title="Calendar"
          desc="Availability windows and booked appointments."
          href="/calendar"
          status="Phase 4–5"
        />
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  desc,
  href,
  status,
}: {
  title: string;
  desc: string;
  href: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 group-hover:text-brand-dark">
          {title}
        </h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </Link>
  );
}
