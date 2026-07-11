"use client";

import { useMemo, useState } from "react";
import PeopleTable from "@/components/PeopleTable";
import { ageFromDob } from "@/lib/eligibility";
import type { PersonWithStudies } from "@/lib/people";

interface Filters {
  status: string;
  repeat: string;
  cataract: string;
  ageMin: string;
  ageMax: string;
  eyeCondition: string;
  ocular: string;
  rxMin: string;
  rxMax: string;
  emailOptIn: string;
  smsOptIn: string;
  source: string;
  tag: string;
  study: string; // "" any | "__none__" | studyId
}

const EMPTY: Filters = {
  status: "",
  repeat: "",
  cataract: "",
  ageMin: "",
  ageMax: "",
  eyeCondition: "",
  ocular: "",
  rxMin: "",
  rxMax: "",
  emailOptIn: "",
  smsOptIn: "",
  source: "",
  tag: "",
  study: "",
};

const inputCls =
  "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function yesNo(v: boolean | null | undefined): boolean {
  return v === true;
}

function spherePowers(rx: Record<string, unknown> | null): number[] {
  if (!rx || typeof rx !== "object") return [];
  const sphereOf = (eye: unknown): number => {
    if (eye && typeof eye === "object" && "sphere" in eye)
      return Number((eye as { sphere?: unknown }).sphere);
    return Number(eye);
  };
  return [(rx as { od?: unknown }).od, (rx as { os?: unknown }).os]
    .map(sphereOf)
    .filter((n) => Number.isFinite(n));
}

export default function PeopleBrowser({
  people,
  studies,
}: {
  people: PersonWithStudies[];
  studies: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Filters>(EMPTY);

  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));

  const activeCount = useMemo(
    () => Object.values(f).filter((v) => v !== "").length,
    [f]
  );

  const filtered = useMemo(() => {
    return people.filter((p) => {
      if (f.status && p.status !== f.status) return false;
      if (f.repeat === "yes" && !p.is_repeat_participant) return false;
      if (f.repeat === "no" && p.is_repeat_participant) return false;

      if (f.cataract === "yes" && p.had_cataract_surgery !== true) return false;
      if (f.cataract === "no" && p.had_cataract_surgery !== false) return false;
      if (f.cataract === "unknown" && p.had_cataract_surgery !== null)
        return false;

      if (f.ageMin || f.ageMax) {
        const age = ageFromDob(p.date_of_birth);
        if (age === null) return false;
        if (f.ageMin && age < Number(f.ageMin)) return false;
        if (f.ageMax && age > Number(f.ageMax)) return false;
      }

      if (f.eyeCondition) {
        const needle = f.eyeCondition.trim().toLowerCase();
        const has = (p.eye_conditions ?? []).some((c) =>
          c.toLowerCase().includes(needle)
        );
        if (!has) return false;
      }

      if (f.ocular === "none" && (p.ocular_health_issues ?? []).length > 0)
        return false;
      if (f.ocular === "any" && (p.ocular_health_issues ?? []).length === 0)
        return false;

      if (f.rxMin || f.rxMax) {
        const powers = spherePowers(p.contact_rx);
        if (powers.length === 0) return false;
        const min = f.rxMin ? Number(f.rxMin) : -Infinity;
        const max = f.rxMax ? Number(f.rxMax) : Infinity;
        if (!powers.some((pw) => pw >= min && pw <= max)) return false;
      }

      if (f.emailOptIn === "yes" && !yesNo(p.email_opt_in)) return false;
      if (f.emailOptIn === "no" && yesNo(p.email_opt_in)) return false;
      if (f.smsOptIn === "yes" && !yesNo(p.sms_opt_in)) return false;
      if (f.smsOptIn === "no" && yesNo(p.sms_opt_in)) return false;

      if (f.source) {
        if (!(p.source ?? "").toLowerCase().includes(f.source.trim().toLowerCase()))
          return false;
      }

      if (f.tag) {
        const needle = f.tag.trim().toLowerCase();
        if (!(p.tags ?? []).some((t) => t.toLowerCase().includes(needle)))
          return false;
      }

      if (f.study === "__none__" && p.studies.length > 0) return false;
      if (
        f.study &&
        f.study !== "__none__" &&
        !p.studies.some((s) => s.studyId === f.study)
      )
        return false;

      return true;
    });
  }, [people, f]);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
          <span className="text-slate-400">{open ? "▲" : "▼"}</span>
        </button>
        {activeCount > 0 && (
          <button
            onClick={() => setF(EMPTY)}
            className="text-sm text-slate-500 hover:underline"
          >
            Clear all
          </button>
        )}
        <span className="text-xs text-slate-400">
          Showing {filtered.length} of {people.length}
        </span>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Status">
            <select
              value={f.status}
              onChange={(e) => set({ status: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="do_not_contact">Do not contact</option>
            </select>
          </Field>

          <Field label="Study involvement">
            <select
              value={f.study}
              onChange={(e) => set({ study: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="__none__">Not in any study</option>
              {studies.map((s) => (
                <option key={s.id} value={s.id}>
                  In: {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Repeat participant">
            <select
              value={f.repeat}
              onChange={(e) => set({ repeat: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label="Age (years)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={f.ageMin}
                onChange={(e) => set({ ageMin: e.target.value })}
                placeholder="min"
                className={inputCls}
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                value={f.ageMax}
                onChange={(e) => set({ ageMax: e.target.value })}
                placeholder="max"
                className={inputCls}
              />
            </div>
          </Field>

          <Field label="Cataract surgery">
            <select
              value={f.cataract}
              onChange={(e) => set({ cataract: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>

          <Field label="Ocular health issues">
            <select
              value={f.ocular}
              onChange={(e) => set({ ocular: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="none">None reported</option>
              <option value="any">Any reported</option>
            </select>
          </Field>

          <Field label="Eye condition includes">
            <input
              value={f.eyeCondition}
              onChange={(e) => set({ eyeCondition: e.target.value })}
              placeholder="e.g. glaucoma"
              className={inputCls}
            />
          </Field>

          <Field label="Contact lens power (sphere)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.25"
                value={f.rxMin}
                onChange={(e) => set({ rxMin: e.target.value })}
                placeholder="min"
                className={inputCls}
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                step="0.25"
                value={f.rxMax}
                onChange={(e) => set({ rxMax: e.target.value })}
                placeholder="max"
                className={inputCls}
              />
            </div>
          </Field>

          <Field label="Tag includes">
            <input
              value={f.tag}
              onChange={(e) => set({ tag: e.target.value })}
              placeholder="e.g. contact_lens_wearer"
              className={inputCls}
            />
          </Field>

          <Field label="Source includes">
            <input
              value={f.source}
              onChange={(e) => set({ source: e.target.value })}
              placeholder="e.g. jotform"
              className={inputCls}
            />
          </Field>

          <Field label="Email opt-in">
            <select
              value={f.emailOptIn}
              onChange={(e) => set({ emailOptIn: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label="Text opt-in">
            <select
              value={f.smsOptIn}
              onChange={(e) => set({ smsOptIn: e.target.value })}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-slate-500">No people match these filters.</p>
      ) : (
        <PeopleTable people={filtered} showStudies />
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
