import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getStudy, listCandidates } from "@/lib/studies";
import { describeRule, type Rule } from "@/lib/eligibility";
import { runMatchingAction, inviteAllEligible } from "../actions";
import { isEmailConfigured } from "@/lib/config";
import CandidatesTable from "@/components/CandidatesTable";

export const dynamic = "force-dynamic";

export default async function StudyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <AdminNav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <SetupNotice />
        </main>
      </>
    );
  }

  const study = await getStudy(params.id);
  if (!study) notFound();
  const candidates = await listCandidates(study.id);

  const rules = (study.eligibility_rules?.all ?? []) as Rule[];
  const visits = study.visit_plan?.visits ?? [];
  const eligibleCount = candidates.filter((c) => c.status === "eligible").length;
  const messagingReady = isEmailConfigured;

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{study.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {study.status}
              {study.location ? ` · ${study.location}` : ""}
              {study.start_window || study.end_window
                ? ` · ${study.start_window ?? "…"} → ${study.end_window ?? "…"}`
                : ""}
            </p>
          </div>
          <Link
            href={`/studies/${study.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
        </div>

        {study.description && (
          <p className="mt-4 text-slate-700">{study.description}</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-600">Eligibility</h2>
            {rules.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No rules yet, so everyone on your list qualifies.
              </p>
            ) : (
              <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                {rules.map((r, i) => (
                  <li key={i}>{describeRule(r)}</li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-600">Visits</h2>
            <ol className="mt-2 list-inside list-decimal text-sm text-slate-700">
              {visits.map((v, i) => (
                <li key={i}>
                  {v.name} · {v.duration_min} min
                  {i > 0 && v.min_gap_days != null && (
                    <span className="text-slate-400">
                      {" "}
                      ({v.min_gap_days}–{v.max_gap_days} days after previous)
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Matching */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Candidates{" "}
            <span className="text-slate-400">({candidates.length})</span>
          </h2>
          <div className="flex gap-2">
            {eligibleCount > 0 && (
              <form action={inviteAllEligible}>
                <input type="hidden" name="study_id" value={study.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-light/20"
                >
                  Invite all eligible ({eligibleCount})
                </button>
              </form>
            )}
            <form action={runMatchingAction}>
              <input type="hidden" name="study_id" value={study.id} />
              <button
                type="submit"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Find eligible people
              </button>
            </form>
          </div>
        </div>

        {!messagingReady && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Email isn&apos;t configured yet, so invites will be logged as
            &quot;skipped&quot; until you add email credentials. Everything else works.
          </p>
        )}

        {candidates.length === 0 ? (
          <p className="mt-4 text-slate-500">
            No candidates yet. Click &quot;Find eligible people&quot; to match your
            list against this study&apos;s rules.
          </p>
        ) : (
          <div className="mt-4">
            <CandidatesTable candidates={candidates} studyId={study.id} />
          </div>
        )}
      </main>
    </>
  );
}
