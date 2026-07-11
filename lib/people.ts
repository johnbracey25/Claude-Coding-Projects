import { createClient } from "./supabase/server";
import type { Person, CandidateStatus } from "./types";

export interface PeopleQuery {
  search?: string;
  limit?: number;
  includeArchived?: boolean;
}

/** A study a person is a candidate for, with their status in it. */
export interface StudyInvolvement {
  studyId: string;
  studyName: string;
  status: CandidateStatus;
  /** True once an invite was actually sent (or they progressed past matching). */
  invited: boolean;
}

export type PersonWithStudies = Person & { studies: StudyInvolvement[] };

const INVITED_STATUSES: CandidateStatus[] = [
  "invited",
  "responded",
  "booked",
  "completed",
];

/**
 * People plus the studies each has been matched/invited to. Used by the People
 * browser so staff can see and filter on study involvement.
 */
export async function listPeopleWithStudies(
  query: PeopleQuery = {}
): Promise<PersonWithStudies[]> {
  const people = await listPeople({ ...query, limit: query.limit ?? 1000 });
  if (people.length === 0) return [];

  const supabase = createClient();
  const { data: cands } = await supabase
    .from("candidates")
    .select("person_id, status, invited_at, study:studies(id, name)")
    .limit(5000);

  const byPerson = new Map<string, StudyInvolvement[]>();
  for (const c of (cands ?? []) as unknown as Array<{
    person_id: string;
    status: CandidateStatus;
    invited_at: string | null;
    study: { id: string; name: string } | null;
  }>) {
    if (!c.study) continue;
    const invited =
      c.invited_at != null || INVITED_STATUSES.includes(c.status);
    const arr = byPerson.get(c.person_id) ?? [];
    arr.push({
      studyId: c.study.id,
      studyName: c.study.name,
      status: c.status,
      invited,
    });
    byPerson.set(c.person_id, arr);
  }

  return people.map((p) => ({ ...p, studies: byPerson.get(p.id) ?? [] }));
}

export async function listPeople(
  query: PeopleQuery = {}
): Promise<Person[]> {
  const supabase = createClient();
  let q = supabase
    .from("people")
    .select("*")
    .order("last_name", { ascending: true })
    .limit(query.limit ?? 200);

  if (!query.includeArchived) {
    q = q.is("archived_at", null);
  }

  if (query.search?.trim()) {
    const s = query.search.trim();
    q = q.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function listArchivedPeople(): Promise<Person[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as Person[];
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Person) ?? null;
}

export async function countPeople(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true })
    .is("archived_at", null);
  if (error) throw error;
  return count ?? 0;
}
