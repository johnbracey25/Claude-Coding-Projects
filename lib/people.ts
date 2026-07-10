import { createClient } from "./supabase/server";
import type { Person } from "./types";

export interface PeopleQuery {
  search?: string;
  limit?: number;
  includeArchived?: boolean;
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
