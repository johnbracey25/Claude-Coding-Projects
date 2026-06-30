"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/studies";
import type { StudyStatus } from "@/lib/types";

function str(v: FormDataEntryValue | null): string | null {
  const s = ((v as string) ?? "").trim();
  return s || null;
}

/** Create or update a study from the builder form. */
export async function saveStudy(formData: FormData) {
  const id = str(formData.get("id"));

  let eligibility_rules: unknown = { all: [] };
  let visit_plan: unknown = { visits: [{ name: "Visit 1", duration_min: 60 }] };
  try {
    eligibility_rules = JSON.parse(String(formData.get("rules_json") ?? "{}"));
  } catch {
    /* keep default */
  }
  try {
    visit_plan = JSON.parse(String(formData.get("visits_json") ?? "{}"));
  } catch {
    /* keep default */
  }

  const values = {
    name: str(formData.get("name")) ?? "Untitled study",
    description: str(formData.get("description")),
    status: (str(formData.get("status")) as StudyStatus) ?? "draft",
    location: str(formData.get("location")),
    start_window: str(formData.get("start_window")),
    end_window: str(formData.get("end_window")),
    compensation: str(formData.get("compensation")),
    eligibility_rules,
    visit_plan,
  };

  const supabase = createClient();

  if (id) {
    const { error } = await supabase.from("studies").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/studies/${id}`);
    revalidatePath("/studies");
    redirect(`/studies/${id}`);
  } else {
    const { data, error } = await supabase
      .from("studies")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/studies");
    redirect(`/studies/${data.id}`);
  }
}

/** Run eligibility matching for a study, then refresh its page. */
export async function runMatchingAction(formData: FormData) {
  const studyId = String(formData.get("study_id") ?? "");
  if (!studyId) return;
  await runMatching(studyId);
  revalidatePath(`/studies/${studyId}`);
}

/** Update a single candidate's status (e.g. mark declined). */
export async function setCandidateStatus(formData: FormData) {
  const candidateId = String(formData.get("candidate_id") ?? "");
  const studyId = String(formData.get("study_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!candidateId || !status) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studies/${studyId}`);
}
