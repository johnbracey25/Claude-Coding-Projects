"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { restorePerson, permanentlyDeletePerson } from "@/app/people/actions";
import type { Person } from "@/lib/types";

function daysAgo(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function ArchivedTable({ people }: { people: Person[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRestore(id: string, name: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await restorePerson(fd);
      router.refresh();
    });
  }

  function handlePermanentDelete(id: string, name: string) {
    if (
      !confirm(
        `Permanently delete ${name}? This cannot be undone.`
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await permanentlyDeletePerson(fd);
      router.refresh();
    });
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Deleted</th>
            <th className="px-4 py-2 font-medium">Days left</th>
            <th className="px-4 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {people.map((p) => {
            const name =
              p.last_name || p.first_name
                ? `${p.first_name} ${p.last_name}`.trim()
                : "(no name)";
            const days = p.archived_at ? daysAgo(p.archived_at) : 0;
            const remaining = Math.max(0, 30 - days);
            return (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-800">
                  {name}
                </td>
                <td className="px-4 py-2 text-slate-600">{p.email ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                  {days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} ago`}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs font-medium ${remaining <= 7 ? "text-rose-600" : "text-slate-500"}`}
                  >
                    {remaining} day{remaining === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(p.id, name)}
                      disabled={pending}
                      className="rounded border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(p.id, name)}
                      disabled={pending}
                      className="rounded border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete forever
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
