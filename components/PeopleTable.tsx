"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { archivePeople } from "@/app/people/actions";
import type { Person } from "@/lib/types";

export default function PeopleTable({ people }: { people: Person[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const allSelected = people.length > 0 && selected.size === people.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(people.map((p) => p.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const count = selected.size;
    if (
      !confirm(
        `Delete ${count} ${count === 1 ? "record" : "records"}? You can recover them for 30 days from the Archived page.`
      )
    )
      return;

    startTransition(async () => {
      await archivePeople(Array.from(selected));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2">
          <span className="text-sm font-medium text-rose-700">
            {selected.size} {selected.size === 1 ? "person" : "people"} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={pending}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Phone</th>
              <th className="px-4 py-2 font-medium">DOB</th>
              <th className="px-4 py-2 font-medium">Eye info</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {people.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-slate-50 ${selected.has(p.id) ? "bg-brand/5" : ""}`}
              >
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <Link
                    href={`/people/${p.id}`}
                    className="font-medium text-brand-dark hover:underline"
                  >
                    {p.last_name || p.first_name
                      ? `${p.last_name}${p.last_name && p.first_name ? ", " : ""}${p.first_name}`
                      : "(no name)"}
                  </Link>
                  {p.is_repeat_participant && (
                    <span className="ml-2 rounded-full bg-sage/20 px-2 py-0.5 text-xs font-medium text-sage-dark">
                      Repeat
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{p.email ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {p.phone ?? "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {p.date_of_birth ?? "-"}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  <EyeSummary person={p} />
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                  {p.source ?? "-"}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EyeSummary({ person: p }: { person: Person }) {
  const parts: string[] = [];
  if (p.had_cataract_surgery) parts.push("Cataract surg.");
  if (p.eye_conditions?.length) parts.push(p.eye_conditions.join(", "));
  if (p.contact_rx) parts.push("Rx on file");
  if (!parts.length) return <span className="text-slate-400">-</span>;
  return (
    <span
      className="block max-w-[12rem] truncate"
      title={parts.join(" · ")}
    >
      {parts.join(" · ")}
    </span>
  );
}

function StatusBadge({ status }: { status: Person["status"] }) {
  const styles: Record<Person["status"], string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    do_not_contact: "bg-rose-100 text-rose-700",
  };
  const label: Record<Person["status"], string> = {
    active: "Active",
    inactive: "Inactive",
    do_not_contact: "Do not contact",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>
      {label[status]}
    </span>
  );
}
