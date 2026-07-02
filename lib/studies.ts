import { createClient } from "./supabase/server";
import { evaluatePerson, type RuleSet } from "./eligibility";
import type { Study, Candidate, Person } from "./types";

/** Server-side data access for studies + candidate matching (staff RLS). */

export async function listStudies(): Promise<Study[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Study[];
}

export async function getStudy(id: string): Promise<Study | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Study) ?? null;
}

export interface CandidateWithPerson extends Candidate {
  person: Pick<
    Person,
    "id" | "first_name" | "last_name" | "email" | "phone" | "status"
  >;
}

export async function listCandidates(
  studyId: string
): Promise<CandidateWithPerson[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "*, person:people(id,first_name,last_name,email,phone,status)"
    )
    .eq("study_id", studyId)
    .order("matched_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CandidateWithPerson[];
}

export interface MatchSummary {
  evaluated: number;
  eligible: number;
  newlyAdded: number;
  alreadyCandidates: number;
}

/**
 * Evaluate every contactable person against a study's eligibility rules and add
 * the eligible ones as candidates. Existing candidates are left as-is (so we
 * never downgrade someone already invited/booked); only their reasons snapshot
 * is refreshed.
 */
export async function runMatching(studyId: string): Promise<MatchSummary> {
  const supabase = createClient();

  const study = await getStudy(studyId);
  if (!study) throw new Error("Study not found");

  const { data: peopleData, error: peopleErr } = await supabase
    .from("people")
    .select("*")
    .neq("status", "do_not_contact");
  if (peopleErr) throw peopleErr;
  const people = (peopleData ?? []) as Person[];

  const { data: existing, error: existErr } = await supabase
    .from("candidates")
    .select("person_id")
    .eq("study_id", studyId);
  if (existErr) throw existErr;
  const existingIds = new Set((existing ?? []).map((c) => c.person_id));

  const rules = study.eligibility_rules as RuleSet;
  const asOf = new Date();

  let eligibleCount = 0;
  const toInsert: Array<{
    study_id: string;
    person_id: string;
    status: "eligible";
    reasons: unknown;
  }> = [];

  for (const person of people) {
    const result = evaluatePerson(person, rules, asOf);
    if (!result.eligible) continue;
    eligibleCount += 1;
    if (existingIds.has(person.id)) continue;
    toInsert.push({
      study_id: studyId,
      person_id: person.id,
      status: "eligible",
      reasons: result.results,
    });
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from("candidates").insert(toInsert);
    if (insErr) throw insErr;
  }

  return {
    evaluated: people.length,
    eligible: eligibleCount,
    newlyAdded: toInsert.length,
    alreadyCandidates: eligibleCount - toInsert.length,
  };
}
