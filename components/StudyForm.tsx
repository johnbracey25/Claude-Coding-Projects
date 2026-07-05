"use client";

import { useState } from "react";
import { saveStudy } from "@/app/studies/actions";
import { CRITERIA, type CriterionKey, type RuleOp } from "@/lib/eligibility";
import type { Study, VisitDef } from "@/lib/types";

interface RuleRow {
  field: CriterionKey;
  op: RuleOp;
  value: string;
  value2: string; // for age "between" upper bound
}

const inputCls =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function criterion(key: CriterionKey) {
  return CRITERIA.find((c) => c.key === key)!;
}

function rulesFromStudy(study?: Study): RuleRow[] {
  const all = (study?.eligibility_rules?.all ?? []) as Array<{
    field: CriterionKey;
    op: RuleOp;
    value?: unknown;
  }>;
  return all.map((r) => {
    const isRange = r.op === "between" && Array.isArray(r.value);
    return {
      field: r.field,
      op: r.op,
      value: isRange
        ? String((r.value as unknown[])[0])
        : r.value === true
          ? "yes"
          : r.value === false
            ? "no"
            : r.value != null
              ? String(r.value)
              : "",
      value2: isRange ? String((r.value as unknown[])[1]) : "",
    };
  });
}

function visitsFromStudy(study?: Study): VisitDef[] {
  return (
    study?.visit_plan?.visits ?? [{ name: "Visit 1", duration_min: 60 }]
  ).map((v) => ({ ...v }));
}

export default function StudyForm({ study }: { study?: Study }) {
  const [rules, setRules] = useState<RuleRow[]>(rulesFromStudy(study));
  const [visits, setVisits] = useState<VisitDef[]>(visitsFromStudy(study));

  function addRule() {
    setRules([...rules, { field: "age", op: "between", value: "40", value2: "70" }]);
  }
  function updateRule(i: number, patch: Partial<RuleRow>) {
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRule(i: number) {
    setRules(rules.filter((_, idx) => idx !== i));
  }

  function addVisit() {
    setVisits([
      ...visits,
      { name: `Visit ${visits.length + 1}`, duration_min: 60, min_gap_days: 7, max_gap_days: 14 },
    ]);
  }
  function updateVisit(i: number, patch: Partial<VisitDef>) {
    setVisits(visits.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function removeVisit(i: number) {
    setVisits(visits.filter((_, idx) => idx !== i));
  }

  // Serialize state → JSON the server action stores.
  const rulesJson = JSON.stringify({
    all: rules.map((r) => {
      const c = criterion(r.field);
      let value: unknown = r.value;
      if (c.valueInput === "age_range" || c.valueInput === "rx_range") {
        value =
          r.op === "between"
            ? [Number(r.value || 0), Number(r.value2 || 0)]
            : Number(r.value || 0);
      } else if (c.valueInput === "boolean") {
        value = r.value === "yes";
      } else if (r.op === "is_empty" || r.op === "not_empty") {
        value = undefined;
      }
      return { field: r.field, op: r.op, value };
    }),
  });
  const visitsJson = JSON.stringify({ visits });

  return (
    <form action={saveStudy} className="mt-6 space-y-6">
      {study && <input type="hidden" name="id" value={study.id} />}
      <input type="hidden" name="rules_json" value={rulesJson} />
      <input type="hidden" name="visits_json" value={visitsJson} />

      {/* Basics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-600">Study name</span>
          <input name="name" required defaultValue={study?.name ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-600">Description</span>
          <textarea name="description" rows={2} defaultValue={study?.description ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Status</span>
          <select name="status" defaultValue={study?.status ?? "draft"} className={`w-full ${inputCls}`}>
            <option value="draft">Draft</option>
            <option value="recruiting">Recruiting</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Location</span>
          <input name="location" defaultValue={study?.location ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Recruiting from</span>
          <input name="start_window" type="date" defaultValue={study?.start_window ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Recruiting until</span>
          <input name="end_window" type="date" defaultValue={study?.end_window ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-600">Compensation (shown to participants, optional)</span>
          <input name="compensation" defaultValue={study?.compensation ?? ""} className={`w-full ${inputCls}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            Address (used for the map link in the day-before email)
          </span>
          <input
            name="address"
            placeholder="e.g. 123 Main St, Athens, GA 30605"
            defaultValue={study?.address ?? ""}
            className={`w-full ${inputCls}`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            What to bring / expect (shown in the day-before email, optional)
          </span>
          <textarea
            name="prep_instructions"
            rows={2}
            placeholder="e.g. Please bring your glasses and current contact lenses. Parking is free in the front lot."
            defaultValue={study?.prep_instructions ?? ""}
            className={`w-full ${inputCls}`}
          />
        </label>
      </div>

      {/* Eligibility rules */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-600">Who qualifies</legend>
        <p className="text-sm text-slate-500">
          Everyone on your list is checked against ALL of these. No rules = everyone qualifies.
        </p>
        <div className="mt-3 space-y-2">
          {rules.map((r, i) => {
            const c = criterion(r.field);
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={r.field}
                  onChange={(e) => {
                    const field = e.target.value as CriterionKey;
                    updateRule(i, { field, op: criterion(field).ops[0].op });
                  }}
                  className={inputCls}
                >
                  {CRITERIA.map((cc) => (
                    <option key={cc.key} value={cc.key}>
                      {cc.label}
                    </option>
                  ))}
                </select>

                <select value={r.op} onChange={(e) => updateRule(i, { op: e.target.value as RuleOp })} className={inputCls}>
                  {c.ops.map((o) => (
                    <option key={o.op} value={o.op}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Value input depends on criterion type */}
                {(c.valueInput === "age_range" || c.valueInput === "rx_range") &&
                  r.op === "between" && (
                    <span className="flex items-center gap-1">
                      <input
                        type="number"
                        step={c.valueInput === "rx_range" ? "0.25" : "1"}
                        value={r.value}
                        onChange={(e) => updateRule(i, { value: e.target.value })}
                        className={`w-24 ${inputCls}`}
                      />
                      <span className="text-slate-400">and</span>
                      <input
                        type="number"
                        step={c.valueInput === "rx_range" ? "0.25" : "1"}
                        value={r.value2}
                        onChange={(e) => updateRule(i, { value2: e.target.value })}
                        className={`w-24 ${inputCls}`}
                      />
                    </span>
                  )}
                {(c.valueInput === "age_range" || c.valueInput === "rx_range") &&
                  r.op !== "between" && (
                    <input
                      type="number"
                      step={c.valueInput === "rx_range" ? "0.25" : "1"}
                      value={r.value}
                      onChange={(e) => updateRule(i, { value: e.target.value })}
                      className={`w-24 ${inputCls}`}
                    />
                  )}
                {c.valueInput === "boolean" && (
                  <select value={r.value} onChange={(e) => updateRule(i, { value: e.target.value })} className={inputCls}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                )}
                {c.valueInput === "text" && r.op !== "is_empty" && r.op !== "not_empty" && (
                  <input value={r.value} placeholder="e.g. glaucoma" onChange={(e) => updateRule(i, { value: e.target.value })} className={inputCls} />
                )}

                <button type="button" onClick={() => removeRule(i)} className="text-sm text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={addRule} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          + Add criterion
        </button>
      </fieldset>

      {/* Visit plan */}
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-600">Visits</legend>
        <p className="text-sm text-slate-500">
          For multi-visit studies, set how many days after the previous visit each one can happen.
        </p>
        <div className="mt-3 space-y-3">
          {visits.map((v, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">Name</span>
                <input value={v.name} onChange={(e) => updateVisit(i, { name: e.target.value })} className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-500">Duration (min)</span>
                <input type="number" value={v.duration_min} onChange={(e) => updateVisit(i, { duration_min: Number(e.target.value) })} className={`w-28 ${inputCls}`} />
              </label>
              {i > 0 && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-500">Min days after prev</span>
                    <input type="number" value={v.min_gap_days ?? 0} onChange={(e) => updateVisit(i, { min_gap_days: Number(e.target.value) })} className={`w-32 ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-500">Max days after prev</span>
                    <input type="number" value={v.max_gap_days ?? 0} onChange={(e) => updateVisit(i, { max_gap_days: Number(e.target.value) })} className={`w-32 ${inputCls}`} />
                  </label>
                  <button type="button" onClick={() => removeVisit(i)} className="pb-2 text-sm text-rose-600 hover:underline">
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addVisit} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          + Add visit
        </button>
      </fieldset>

      <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">
        {study ? "Save study" : "Create study"}
      </button>
    </form>
  );
}
