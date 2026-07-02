import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { PersonInput } from "@/lib/types";

/**
 * Bulk import endpoint. Receives already-mapped, already-parsed person rows
 * from the client importer and upserts them, de-duplicating on email (then
 * phone). Uses the service-role client so the batch write isn't blocked by RLS.
 *
 * Body: { rows: PersonInput[], source?: string }
 * Returns: { inserted, updated, skipped, errors }
 */

interface ImportBody {
  rows: PersonInput[];
  source?: string;
}

const MAX_ROWS = 10000;

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Database not configured. Set Supabase env vars first." },
      { status: 503 }
    );
  }

  let body: ImportBody;
  try {
    body = (await req.json()) as ImportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows provided." }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS}). Split the file.` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Tag with source and drop rows that have no identifying info at all.
  const cleaned = rows
    .map((r) => ({ ...r, source: r.source ?? body.source ?? "csv_import" }))
    .filter(
      (r) =>
        (r.email && r.email.trim()) ||
        (r.phone && r.phone.trim()) ||
        (r.first_name && r.first_name.trim()) ||
        (r.last_name && r.last_name.trim())
    );

  const skipped = rows.length - cleaned.length;

  // Collect candidate keys to find existing matches in one query each.
  const emails = unique(
    cleaned.map((r) => r.email?.trim().toLowerCase()).filter(Boolean) as string[]
  );
  const phones = unique(
    cleaned.map((r) => r.phone?.trim()).filter(Boolean) as string[]
  );

  const existingByEmail = new Map<string, string>(); // email -> id
  const existingByPhone = new Map<string, string>(); // phone -> id

  try {
    if (emails.length) {
      const { data } = await supabase
        .from("people")
        .select("id,email")
        .in("email", emails);
      for (const row of data ?? []) {
        if (row.email) existingByEmail.set(row.email.toLowerCase(), row.id);
      }
    }
    if (phones.length) {
      const { data } = await supabase
        .from("people")
        .select("id,phone")
        .in("phone", phones);
      for (const row of data ?? []) {
        if (row.phone) existingByPhone.set(row.phone, row.id);
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lookup failed." },
      { status: 500 }
    );
  }

  const toInsert: PersonInput[] = [];
  const toUpdate: { id: string; values: PersonInput }[] = [];
  // Track keys seen within this batch to avoid inserting the same person twice.
  const seenEmail = new Set<string>();
  const seenPhone = new Set<string>();

  for (const r of cleaned) {
    const email = r.email?.trim().toLowerCase() || null;
    const phone = r.phone?.trim() || null;

    const existingId =
      (email && existingByEmail.get(email)) ||
      (phone && existingByPhone.get(phone)) ||
      null;

    if (existingId) {
      toUpdate.push({ id: existingId, values: r });
      continue;
    }
    // De-dupe within the same file.
    if (email && seenEmail.has(email)) {
      toUpdate.push({ id: "", values: r }); // counted as duplicate-merge below
      continue;
    }
    if (phone && seenPhone.has(phone)) {
      toUpdate.push({ id: "", values: r });
      continue;
    }
    if (email) seenEmail.add(email);
    if (phone) seenPhone.add(phone);
    toInsert.push(r);
  }

  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  // Insert new people in chunks.
  for (const chunk of chunked(toInsert, 500)) {
    const { error, count } = await supabase
      .from("people")
      .insert(chunk, { count: "exact" });
    if (error) errors.push(error.message);
    else inserted += count ?? chunk.length;
  }

  // Apply updates to existing matches (skip in-file duplicates with empty id).
  for (const u of toUpdate) {
    if (!u.id) continue;
    const { error } = await supabase
      .from("people")
      .update(u.values)
      .eq("id", u.id);
    if (error) errors.push(error.message);
    else updated += 1;
  }

  const duplicatesInFile = toUpdate.filter((u) => !u.id).length;

  return NextResponse.json({
    inserted,
    updated,
    skipped,
    duplicatesInFile,
    errors,
  });
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
