"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { archivePeople } from "@/app/people/actions";
import { ageFromDob } from "@/lib/eligibility";
import type { Person, CandidateStatus } from "@/lib/types";
import type { StudyInvolvement } from "@/lib/people";

type PersonRow = Person & { studies?: StudyInvolvement[] };

// ── Contact-lens helpers ─────────────────────────────────────────────────────

function wearsContacts(p: Person): boolean {
  return (p.tags ?? []).includes("contact_lens_wearer") || !!p.contact_rx;
}

function eyeSphere(rx: Record<string, unknown> | null, eye: "od" | "os"): string | null {
  if (!rx || typeof rx !== "object") return null;
  const e = (rx as Record<string, unknown>)[eye];
  if (e && typeof e === "object" && "sphere" in e) {
    const s = (e as { sphere?: unknown }).sphere;
    return s != null && String(s).trim() ? String(s) : null;
  }
  return e != null && String(e).trim() ? String(e) : null;
}

function powersShort(p: Person): string {
  const rx = p.contact_rx;
  const od = eyeSphere(rx, "od");
  const os = eyeSphere(rx, "os");
  const parts: string[] = [];
  if (od) parts.push(`OD ${od}`);
  if (os) parts.push(`OS ${os}`);
  return parts.join(" / ");
}

function eyeFull(rx: Record<string, unknown> | null, eye: "od" | "os"): string {
  if (!rx || typeof rx !== "object") return "—";
  const e = (rx as Record<string, unknown>)[eye];
  if (!e) return "—";
  if (typeof e === "object") {
    const o = e as { sphere?: unknown; cylinder?: unknown; axis?: unknown };
    const s = o.sphere != null ? String(o.sphere) : "";
    if (!s) return "—";
    const c = o.cylinder != null && String(o.cylinder) ? ` / ${o.cylinder}` : "";
    const a = o.axis != null && String(o.axis) ? ` x ${o.axis}` : "";
    return `${s}${c}${a}`;
  }
  return String(e);
}

function brandOf(rx: Record<string, unknown> | null): string | null {
  const b = rx && typeof rx === "object" ? (rx as { brand?: unknown }).brand : null;
  return typeof b === "string" && b.trim() ? b : null;
}

export default function PeopleTable({
  people,
  showStudies = false,
}: {
  people: PersonRow[];
  showStudies?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [hover, setHover] = useState<{ id: string; top: number; left: number } | null>(
    null
  );
  const router = useRouter();

  const allSelected = people.length > 0 && selected.size === people.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(people.map((p) => p.id)));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function showQuick(e: React.MouseEvent, id: string) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = 300;
    let left = r.right + 10;
    if (left + width > window.innerWidth - 8) left = Math.max(8, r.left - width - 10);
    const top = Math.max(8, Math.min(r.top, window.innerHeight - 380));
    setHover({ id, top, left });
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

  const hovered = hover ? people.find((p) => p.id === hover.id) : null;

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
              <th className="px-4 py-2 font-medium">Contacts</th>
              <th className="px-4 py-2 font-medium">Eye info</th>
              {showStudies && <th className="px-4 py-2 font-medium">Studies</th>}
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {people.map((p) => {
              const w = wearsContacts(p);
              const powers = powersShort(p);
              return (
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
                  <td
                    className="whitespace-nowrap px-4 py-2"
                    onMouseEnter={(e) => showQuick(e, p.id)}
                    onMouseLeave={() => setHover(null)}
                  >
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
                  <td className="whitespace-nowrap px-4 py-2">
                    {w ? (
                      <>
                        <span className="font-medium text-slate-700">Yes</span>
                        {powers && (
                          <p className="text-xs text-slate-500">{powers}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    <EyeSummary person={p} />
                  </td>
                  {showStudies && (
                    <td className="px-4 py-2 text-slate-600">
                      <StudiesSummary studies={p.studies ?? []} />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                    {p.source ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover quick view */}
      {hovered && hover && (
        <div
          className="pointer-events-none fixed z-50 w-[300px] rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"
          style={{ top: hover.top, left: hover.left }}
        >
          <QuickView p={hovered} />
        </div>
      )}
    </>
  );
}

function QuickView({ p }: { p: Person }) {
  const name = `${p.first_name} ${p.last_name}`.trim() || "(no name)";
  const age = ageFromDob(p.date_of_birth);
  const w = wearsContacts(p);
  const brand = brandOf(p.contact_rx);
  const cataract =
    p.had_cataract_surgery === true
      ? "Yes"
      : p.had_cataract_surgery === false
        ? "No"
        : "Unknown";

  return (
    <div>
      <p className="font-semibold text-slate-900">{name}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {age != null ? `Age ${age}` : "Age —"}
        {p.date_of_birth ? ` · ${p.date_of_birth}` : ""}
      </p>

      <div className="mt-3 space-y-1.5">
        <Row label="Contacts" value={w ? "Yes" : "No"} />
        {w && (
          <>
            {brand && <Row label="Brand" value={brand} />}
            <Row label="OD" value={eyeFull(p.contact_rx, "od")} />
            <Row label="OS" value={eyeFull(p.contact_rx, "os")} />
          </>
        )}
        <Row label="Cataract surgery" value={cataract} />
        <Row
          label="Eye conditions"
          value={p.eye_conditions?.length ? p.eye_conditions.join(", ") : "None"}
        />
        <Row
          label="Ocular issues"
          value={
            p.ocular_health_issues?.length
              ? p.ocular_health_issues.join(", ")
              : "None"
          }
        />
        {p.tags?.length ? <Row label="Tags" value={p.tags.join(", ")} /> : null}
        <Row label="Source" value={p.source ?? "—"} />
        {p.notes ? <Row label="Notes" value={p.notes} /> : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 flex-none text-xs font-medium text-slate-400">
        {label}
      </span>
      <span className="text-xs text-slate-700">{value}</span>
    </div>
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

const CAND_BADGE: Record<CandidateStatus, string> = {
  eligible: "bg-sky-100 text-sky-700",
  invited: "bg-indigo-100 text-indigo-700",
  responded: "bg-amber-100 text-amber-700",
  booked: "bg-emerald-100 text-emerald-700",
  completed: "bg-teal-100 text-teal-700",
  declined: "bg-rose-100 text-rose-700",
  ineligible: "bg-slate-100 text-slate-500",
};

function StudiesSummary({ studies }: { studies: StudyInvolvement[] }) {
  if (!studies.length) return <span className="text-slate-400">-</span>;
  return (
    <div className="flex flex-col gap-1">
      {studies.map((s) => (
        <span key={s.studyId} className="flex items-center gap-1">
          <Link
            href={`/studies/${s.studyId}`}
            className="max-w-[9rem] truncate text-brand-dark hover:underline"
          >
            {s.studyName}
          </Link>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${CAND_BADGE[s.status]}`}
          >
            {s.status}
          </span>
        </span>
      ))}
    </div>
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
