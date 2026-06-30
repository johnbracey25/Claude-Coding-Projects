"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone, normalizeDate } from "@/lib/people-fields";
import type { PersonInput, PersonStatus } from "@/lib/types";

/** Split a comma/semicolon list into a clean string array. */
function toArray(v: FormDataEntryValue | null): string[] {
  const s = (v as string) ?? "";
  return s
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function str(v: FormDataEntryValue | null): string | null {
  const s = ((v as string) ?? "").trim();
  return s || null;
}

/**
 * Create or update a person from the edit form. When `id` is present in the
 * form data it updates that row, otherwise it inserts a new one. Runs as the
 * signed-in staff user (RLS enforced).
 */
export async function savePerson(formData: FormData) {
  const id = str(formData.get("id"));

  const cataract = str(formData.get("had_cataract_surgery"));
  const values: PersonInput = {
    first_name: (str(formData.get("first_name")) ?? "") as string,
    last_name: (str(formData.get("last_name")) ?? "") as string,
    email: str(formData.get("email")),
    phone: formData.get("phone")
      ? normalizePhone((formData.get("phone") as string) ?? "")
      : null,
    date_of_birth: normalizeDate((formData.get("date_of_birth") as string) ?? ""),
    status: (str(formData.get("status")) as PersonStatus) ?? "active",
    email_opt_in: formData.get("email_opt_in") === "on",
    sms_opt_in: formData.get("sms_opt_in") === "on",
    had_cataract_surgery:
      cataract === "yes" ? true : cataract === "no" ? false : null,
    eye_conditions: toArray(formData.get("eye_conditions")),
    ocular_health_issues: toArray(formData.get("ocular_health_issues")),
    tags: toArray(formData.get("tags")),
    source: str(formData.get("source")),
    notes: str(formData.get("notes")),
  };

  const rxRaw = str(formData.get("contact_rx"));
  if (rxRaw) {
    try {
      values.contact_rx = JSON.parse(rxRaw);
    } catch {
      values.contact_rx = { raw: rxRaw };
    }
  } else {
    values.contact_rx = null;
  }

  const supabase = createClient();

  if (id) {
    const { error } = await supabase.from("people").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/people/${id}`);
    revalidatePath("/people");
    redirect(`/people/${id}`);
  } else {
    const { data, error } = await supabase
      .from("people")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/people");
    redirect(`/people/${data.id}`);
  }
}
