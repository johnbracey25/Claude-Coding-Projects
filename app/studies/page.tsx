import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { listStudies } from "@/lib/studies";
import type { Study } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<Study["status"], string> = {
  draft: "bg-slate-100 text-slate-600",
  recruiting: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-500",
};

export default async function StudiesPage() {
  let studies: Study[] = [];
  let loadError: string | null = null;
  if (isSupabaseConfigured) {
    try {
      studies = await listStudies();
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Failed to load studies.";
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Studies</h1>
          <Link
            href="/studies/new"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            New study
          </Link>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-6">
            <SetupNotice />
          </div>
        ) : loadError ? (
          <div className="mt-6">
            <SetupNotice detail={loadError} />
          </div>
        ) : studies.length === 0 ? (
          <p className="mt-8 text-slate-500">
            No studies yet. Create one to define eligibility rules and match your list.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3">
            {studies.map((s) => (
              <Link
                key={s.id}
                href={`/studies/${s.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{s.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{s.description}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {(s.visit_plan?.visits?.length ?? 1)}-visit ·{" "}
                  {(s.eligibility_rules?.all?.length ?? 0)} eligibility rule(s)
                  {s.location ? ` · ${s.location}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
