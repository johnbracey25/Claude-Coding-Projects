import { createClient } from "./supabase/server";
import type { Person } from "./types";

/**
 * Server-side data access for the people table. Uses the request-scoped
 * Supabase client so row-level security applies as the signed-in staff user.
 */

export interface PeopleQuery {
  search?: string;
  limit?: number;
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

  if (query.search?.trim()) {
    const s = query.search.trim();
    // Match against name, email, or phone.
    q = q.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`
    );
  }

  const { data, error } = await q;
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
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
