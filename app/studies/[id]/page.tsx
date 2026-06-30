import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getStudy, listCandidates, type CandidateWithPerson } from "@/lib/studies";
import { describeRule, type Rule } from "@/lib/eligibility";
import {
  runMatchingAction,
  setCandidateStatus,
  inviteCandidate,
  inviteAllEligible,
} from "../actions";
import { isEmailConfigured, isSmsConfigured } from "@/lib/config";
import type { CandidateStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const CAND_STYLE: Record<CandidateStatus, string> = {
  eligible: "bg-sky-100 text-sky-700",
  invited: "bg-indigo-100 text-indigo-700",
  responded: "bg-amber-100 text-amber-700",
  booked: "bg-emerald-100 text-emerald-700",
  completed: "bg-teal-100 text-teal-700",
  declined: "bg-rose-100 text-rose-700",
  ineligible: "bg-slate-100 text-slate-500",
};

const STATUS_OPTIONS: CandidateStatus[] = [
  "eligible",
  "invited",
  "responded",
  "booked",
  "completed",
  "declined",
];

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
  const messagingReady = isEmailConfigured || isSmsConfigured;

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
                No rules — everyone on your list qualifies.
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
            Email/SMS aren&apos;t configured yet, so invites will be logged as
            &quot;skipped&quot; until you add Resend / Twilio keys. Everything else works.
          </p>
        )}

        {candidates.length === 0 ? (
          <p className="mt-4 text-slate-500">
            No candidates yet. Click &quot;Find eligible people&quot; to match your
            list against this study&apos;s rules.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Contact</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => (
                  <CandidateRow key={c.id} candidate={c} studyId={study.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function CandidateRow({
  candidate,
  studyId,
}: {
  candidate: CandidateWithPerson;
  studyId: string;
}) {
  const p = candidate.person;
  const name = `${p.first_name} ${p.last_name}`.trim() || "(no name)";
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2">
        <Link href={`/people/${p.id}`} className="font-medium text-brand-dark hover:underline">
          {name}
        </Link>
      </td>
      <td className="px-4 py-2 text-slate-600">
        {p.email ?? p.phone ?? "—"}
      </td>
      <td className="px-4 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs ${CAND_STYLE[candidate.status]}`}>
          {candidate.status}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          {candidate.status === "eligible" && (
            <form action={inviteCandidate}>
              <input type="hidden" name="candidate_id" value={candidate.id} />
              <input type="hidden" name="study_id" value={studyId} />
              <button
                type="submit"
                className="rounded bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark"
              >
                Invite
              </button>
            </form>
          )}
          <form action={setCandidateStatus} className="flex items-center gap-1">
            <input type="hidden" name="candidate_id" value={candidate.id} />
            <input type="hidden" name="study_id" value={studyId} />
            <select
              name="status"
              defaultValue={candidate.status}
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="submit" className="text-xs text-brand-dark hover:underline">
              Set
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}
