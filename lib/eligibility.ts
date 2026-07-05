import type { Person } from "./types";

/**
 * Eligibility rules engine. A study stores a `RuleSet` (JSON). We evaluate a
 * Person against it and return whether they qualify plus a per-rule breakdown
 * of reasons — which drives both the candidate matching job and the "why
 * (in)eligible" explanations shown to staff.
 *
 * The CRITERIA catalog below is the single source of truth for which criteria
 * staff can pick in the study builder UI, so the UI and the evaluator never
 * drift apart.
 */

export type RuleOp =
  | "between"
  | "gte"
  | "lte"
  | "eq"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "not_empty";

export interface Rule {
  field: CriterionKey;
  op: RuleOp;
  value?: unknown;
}

export interface RuleSet {
  /** All rules must pass (logical AND). */
  all: Rule[];
}

export type CriterionKey =
  | "age"
  | "had_cataract_surgery"
  | "wears_contacts"
  | "contact_rx_sphere"
  | "is_repeat_participant"
  | "eye_conditions"
  | "ocular_health_issues";

export interface CriterionDef {
  key: CriterionKey;
  label: string;
  /** Operators offered for this criterion in the builder UI. */
  ops: { op: RuleOp; label: string }[];
  /** Input shape the UI should render for the value. */
  valueInput: "age_range" | "rx_range" | "number" | "boolean" | "text" | "none";
  help?: string;
}

export const CRITERIA: CriterionDef[] = [
  {
    key: "age",
    label: "Age",
    ops: [
      { op: "between", label: "is between" },
      { op: "gte", label: "is at least" },
      { op: "lte", label: "is at most" },
    ],
    valueInput: "age_range",
    help: "Calculated from date of birth. People with no DOB won't match age rules.",
  },
  {
    key: "had_cataract_surgery",
    label: "Cataract surgery",
    ops: [{ op: "eq", label: "is" }],
    valueInput: "boolean",
  },
  {
    key: "wears_contacts",
    label: "Wears contact lenses",
    ops: [{ op: "eq", label: "is" }],
    valueInput: "boolean",
  },
  {
    key: "contact_rx_sphere",
    label: "Contact lens power",
    ops: [
      { op: "between", label: "is between" },
      { op: "gte", label: "is at least" },
      { op: "lte", label: "is at most" },
    ],
    valueInput: "rx_range",
    help: "Sphere power in diopters (e.g. -4.00 to -1.00). Matches if either eye falls in range. Non-wearers won't match.",
  },
  {
    key: "is_repeat_participant",
    label: "Repeat participant",
    ops: [{ op: "eq", label: "is" }],
    valueInput: "boolean",
    help: "Whether they've taken part in a previous study.",
  },
  {
    key: "eye_conditions",
    label: "Eye conditions",
    ops: [
      { op: "contains", label: "include" },
      { op: "not_contains", label: "do not include" },
    ],
    valueInput: "text",
    help: "Match a single condition name, e.g. glaucoma.",
  },
  {
    key: "ocular_health_issues",
    label: "Ocular health issues",
    ops: [
      { op: "is_empty", label: "none reported" },
      { op: "not_empty", label: "any reported" },
      { op: "contains", label: "include" },
      { op: "not_contains", label: "do not include" },
    ],
    valueInput: "text",
  },
];

export interface RuleResult {
  rule: Rule;
  passed: boolean;
  detail: string;
}

export interface EligibilityResult {
  eligible: boolean;
  results: RuleResult[];
}

/** Age in whole years from an ISO date string, or null if unparseable. */
export function ageFromDob(dob: string | null, asOf = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age -= 1;
  return age;
}

function personHasTag(person: Person, tag: string): boolean {
  return (person.tags ?? []).includes(tag);
}

/**
 * Numeric sphere powers from a person's stored contact_rx ({ od, os }).
 * Skips "unknown"/blank/unparseable values. Returns [] when nothing usable.
 */
function contactSpherePowers(person: Person): number[] {
  const rx = person.contact_rx as { od?: unknown; os?: unknown } | null;
  if (!rx || typeof rx !== "object") return [];
  // Each eye is { sphere, cylinder, axis }. (Legacy records stored the sphere
  // directly as a string/number, so handle both shapes.)
  const sphereOf = (eye: unknown): number => {
    if (eye && typeof eye === "object" && "sphere" in eye) {
      return Number((eye as { sphere?: unknown }).sphere);
    }
    return Number(eye);
  };
  return [rx.od, rx.os]
    .map(sphereOf)
    .filter((n) => Number.isFinite(n));
}

function arrayHas(arr: string[] | null, needle: unknown): boolean {
  const n = String(needle ?? "").trim().toLowerCase();
  return (arr ?? []).some((x) => x.toLowerCase() === n);
}

/** Evaluate one rule against a person. */
function evalRule(person: Person, rule: Rule, asOf: Date): RuleResult {
  const fail = (detail: string): RuleResult => ({ rule, passed: false, detail });
  const pass = (detail: string): RuleResult => ({ rule, passed: true, detail });

  switch (rule.field) {
    case "age": {
      const age = ageFromDob(person.date_of_birth, asOf);
      if (age === null) return fail("No date of birth on file");
      if (rule.op === "between") {
        const [min, max] = (rule.value as [number, number]) ?? [0, 200];
        return age >= min && age <= max
          ? pass(`Age ${age} is within ${min}–${max}`)
          : fail(`Age ${age} is outside ${min}–${max}`);
      }
      if (rule.op === "gte") {
        const min = Number(rule.value);
        return age >= min ? pass(`Age ${age} ≥ ${min}`) : fail(`Age ${age} < ${min}`);
      }
      if (rule.op === "lte") {
        const max = Number(rule.value);
        return age <= max ? pass(`Age ${age} ≤ ${max}`) : fail(`Age ${age} > ${max}`);
      }
      return fail("Unsupported age comparison");
    }

    case "had_cataract_surgery": {
      const want = rule.value === true || rule.value === "yes" || rule.value === "true";
      if (person.had_cataract_surgery === null)
        return fail("Cataract surgery status unknown");
      return person.had_cataract_surgery === want
        ? pass(`Cataract surgery = ${person.had_cataract_surgery}`)
        : fail(`Cataract surgery = ${person.had_cataract_surgery}, needs ${want}`);
    }

    case "wears_contacts": {
      const want = rule.value === true || rule.value === "yes" || rule.value === "true";
      const has = personHasTag(person, "contact_lens_wearer");
      return has === want
        ? pass(`Wears contacts = ${has}`)
        : fail(`Wears contacts = ${has}, needs ${want}`);
    }

    case "is_repeat_participant": {
      const want = rule.value === true || rule.value === "yes" || rule.value === "true";
      const has = !!person.is_repeat_participant;
      return has === want
        ? pass(`Repeat participant = ${has}`)
        : fail(`Repeat participant = ${has}, needs ${want}`);
    }

    case "contact_rx_sphere": {
      const powers = contactSpherePowers(person);
      if (powers.length === 0)
        return fail("No contact lens prescription on file");
      const label = powers.map((p) => p.toFixed(2)).join(" / ");
      if (rule.op === "between") {
        const [min, max] = (rule.value as [number, number]) ?? [-99, 99];
        return powers.some((p) => p >= min && p <= max)
          ? pass(`Power ${label} within ${min} to ${max}`)
          : fail(`Power ${label} outside ${min} to ${max}`);
      }
      if (rule.op === "gte") {
        const min = Number(rule.value);
        return powers.some((p) => p >= min)
          ? pass(`Power ${label} ≥ ${min}`)
          : fail(`Power ${label} < ${min}`);
      }
      if (rule.op === "lte") {
        const max = Number(rule.value);
        return powers.some((p) => p <= max)
          ? pass(`Power ${label} ≤ ${max}`)
          : fail(`Power ${label} > ${max}`);
      }
      return fail("Unsupported prescription comparison");
    }

    case "eye_conditions": {
      const has = arrayHas(person.eye_conditions, rule.value);
      if (rule.op === "contains")
        return has ? pass(`Has ${rule.value}`) : fail(`Does not have ${rule.value}`);
      if (rule.op === "not_contains")
        return has ? fail(`Has ${rule.value}`) : pass(`Does not have ${rule.value}`);
      return fail("Unsupported condition comparison");
    }

    case "ocular_health_issues": {
      const list = person.ocular_health_issues ?? [];
      if (rule.op === "is_empty")
        return list.length === 0
          ? pass("No ocular health issues")
          : fail(`Has ${list.length} issue(s)`);
      if (rule.op === "not_empty")
        return list.length > 0 ? pass("Has issues") : fail("No issues reported");
      if (rule.op === "contains") {
        const has = arrayHas(list, rule.value);
        return has ? pass(`Has ${rule.value}`) : fail(`Does not have ${rule.value}`);
      }
      if (rule.op === "not_contains") {
        const has = arrayHas(list, rule.value);
        return has ? fail(`Has ${rule.value}`) : pass(`Does not have ${rule.value}`);
      }
      return fail("Unsupported issues comparison");
    }

    default:
      return fail("Unknown criterion");
  }
}

/** Evaluate a person against a full rule set (all rules must pass). */
export function evaluatePerson(
  person: Person,
  ruleSet: RuleSet | null | undefined,
  asOf = new Date()
): EligibilityResult {
  const rules = ruleSet?.all ?? [];
  if (rules.length === 0) return { eligible: true, results: [] };
  const results = rules.map((r) => evalRule(person, r, asOf));
  return { eligible: results.every((r) => r.passed), results };
}

/** Human-readable summary of a rule, for display in the UI. */
export function describeRule(rule: Rule): string {
  const def = CRITERIA.find((c) => c.key === rule.field);
  const label = def?.label ?? rule.field;
  const opLabel = def?.ops.find((o) => o.op === rule.op)?.label ?? rule.op;
  if (rule.op === "between" && Array.isArray(rule.value))
    return `${label} ${opLabel} ${rule.value[0]} and ${rule.value[1]}`;
  if (rule.op === "is_empty" || rule.op === "not_empty")
    return `${label} ${opLabel}`;
  if (rule.op === "eq")
    return `${label} ${opLabel} ${rule.value === true || rule.value === "yes" ? "Yes" : "No"}`;
  return `${label} ${opLabel} ${rule.value ?? ""}`.trim();
}
