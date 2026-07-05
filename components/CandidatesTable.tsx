"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  inviteSelected,
  inviteOneById,
  setStatusById,
} from "@/app/studies/actions";
import type { CandidateWithPerson } from "@/lib/studies";
import type { CandidateStatus } from "@/lib/types";

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

export default function CandidatesTable({
  candidates,
  studyId,
}: {
  candidates: CandidateWithPerson[];
  studyId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === candidates.length
        ? new Set()
        : new Set(candidates.map((c) => c.id))
    );
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/r/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked; fall back to opening it.
      window.open(url, "_blank");
    }
  }

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      setSelected(new Set());
      router.refresh();
    });
  }

  const allChecked = selected.size > 0 && selected.size === candidates.length;

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={() => run(() => inviteSelected(studyId, [...selected]))}
          disabled={selected.size === 0 || pending}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? "Working…" : `Invite selected (${selected.size})`}
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-slate-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Booking link</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => {
              const p = c.person;
              const name = `${p.first_name} ${p.last_name}`.trim() || "(no name)";
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${name}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/people/${p.id}`}
                      className="font-medium text-brand-dark hover:underline"
                    >
                      {name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {p.email ?? p.phone ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLink(c.token)}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {copied === c.token ? "Copied!" : "Copy link"}
                      </button>
                      <a
                        href={`/r/${c.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-dark hover:underline"
                      >
                        Open ↗
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${CAND_STYLE[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c.status === "eligible" && (
                        <button
                          onClick={() => run(() => inviteOneById(studyId, c.id))}
                          disabled={pending}
                          className="rounded bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                        >
                          Invite
                        </button>
                      )}
                      <select
                        defaultValue={c.status}
                        onChange={(e) =>
                          run(() => setStatusById(studyId, c.id, e.target.value))
                        }
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
