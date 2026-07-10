"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/studies";
import { sendEmail } from "@/lib/messaging";
import { inviteEmail } from "@/lib/templates";
import type { StudyStatus, Person, Study, Candidate } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

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

  let calendar_feed_ids: string[] = [];
  try {
    calendar_feed_ids = JSON.parse(
      String(formData.get("calendar_feed_ids") ?? "[]")
    );
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
    address: str(formData.get("address")),
    prep_instructions: str(formData.get("prep_instructions")),
    buffer_min: Number(formData.get("buffer_min") ?? 0) || 0,
    min_lead_hours: Number(formData.get("min_lead_hours") ?? 0) || 0,
    eligibility_rules,
    visit_plan,
  };

  const supabase = createClient();

  let studyId: string;

  if (id) {
    const { error } = await supabase.from("studies").update(values).eq("id", id);
    if (error) throw new Error(error.message);
    studyId = id;
  } else {
    const { data, error } = await supabase
      .from("studies")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    studyId = data.id;
  }

  // Update calendar_feed_ids separately — silently ignore if column doesn't exist yet.
  try {
    await supabase
      .from("studies")
      .update({ calendar_feed_ids })
      .eq("id", studyId);
  } catch {
    /* column may not exist — that's OK */
  }

  revalidatePath(`/studies/${studyId}`);
  revalidatePath("/studies");
  redirect(`/studies/${studyId}`);
}

/**
 * Permanently delete a study. Candidate matches and appointments for it are
 * removed too (FK cascade); sent-message history is kept but unlinked.
 */
export async function deleteStudy(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  const { error } = await supabase.from("studies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/studies");
  redirect("/studies");
}

/** Run eligibility matching for a study, then refresh its page. */
export async function runMatchingAction(formData: FormData) {
  const studyId = String(formData.get("study_id") ?? "");
  if (!studyId) return;
  await runMatching(studyId);
  revalidatePath(`/studies/${studyId}`);
}

interface CandidateJoined extends Candidate {
  person: Person;
  study: Study;
}

/**
 * Invite one candidate: send the invite email, log it, and advance status to
 * 'invited' on success.
 */
async function inviteOne(
  supabase: SupabaseClient,
  candidateId: string
): Promise<"sent" | "skipped" | "failed"> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*, person:people(*), study:studies(*)")
    .eq("id", candidateId)
    .maybeSingle();
  if (error || !data) return "failed";
  const cand = data as unknown as CandidateJoined;
  const { person, study } = cand;

  if (!person.email || !person.email_opt_in) {
    await supabase.from("messages").insert({
      person_id: person.id,
      candidate_id: cand.id,
      channel: "email",
      status: "skipped",
      error: "No email address or email opt-out.",
    });
    return "skipped";
  }

  const tpl = inviteEmail(person, study, cand);
  const result = await sendEmail({
    to: person.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });

  const status = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
  await supabase.from("messages").insert({
    person_id: person.id,
    candidate_id: cand.id,
    channel: "email",
    subject: tpl.subject,
    body: tpl.text,
    status,
    provider_id: result.providerId ?? null,
    error: result.error ?? null,
  });

  if (result.ok) {
    await supabase
      .from("candidates")
      .update({ status: "invited", invited_at: new Date().toISOString() })
      .eq("id", cand.id);
    return "sent";
  }
  return status === "skipped" ? "skipped" : "failed";
}

/** Invite a single candidate (from the candidate row). */
export async function inviteCandidate(formData: FormData) {
  const candidateId = String(formData.get("candidate_id") ?? "");
  const studyId = String(formData.get("study_id") ?? "");
  if (!candidateId) return;
  const supabase = createClient();
  await inviteOne(supabase, candidateId);
  revalidatePath(`/studies/${studyId}`);
}

/** Invite a specific set of candidates (from multi-select). */
export async function inviteSelected(studyId: string, ids: string[]) {
  if (!studyId || ids.length === 0) return;
  const supabase = createClient();
  for (const id of ids) await inviteOne(supabase, id);
  revalidatePath(`/studies/${studyId}`);
}

/** Invite a single candidate by id (client-callable). */
export async function inviteOneById(studyId: string, id: string) {
  if (!id) return;
  const supabase = createClient();
  await inviteOne(supabase, id);
  revalidatePath(`/studies/${studyId}`);
}

/** Set a candidate's status by id (client-callable). */
export async function setStatusById(
  studyId: string,
  id: string,
  status: string
) {
  if (!id || !status) return;
  const supabase = createClient();
  const { data: cand } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", id)
    .select("person_id")
    .single();
  if (status === "completed" && cand?.person_id) {
    await supabase
      .from("people")
      .update({ is_repeat_participant: true })
      .eq("id", cand.person_id);
  }
  revalidatePath(`/studies/${studyId}`);
}

/** Invite every candidate currently in 'eligible' status for a study. */
export async function inviteAllEligible(formData: FormData) {
  const studyId = String(formData.get("study_id") ?? "");
  if (!studyId) return;
  const supabase = createClient();
  const { data } = await supabase
    .from("candidates")
    .select("id")
    .eq("study_id", studyId)
    .eq("status", "eligible");
  for (const row of data ?? []) {
    await inviteOne(supabase, row.id);
  }
  revalidatePath(`/studies/${studyId}`);
}

/** Update a single candidate's status (e.g. mark declined). */
export async function setCandidateStatus(formData: FormData) {
  const candidateId = String(formData.get("candidate_id") ?? "");
  const studyId = String(formData.get("study_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!candidateId || !status) return;
  const supabase = createClient();
  const { data: cand, error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId)
    .select("person_id")
    .single();
  if (error) throw new Error(error.message);

  if (status === "completed" && cand?.person_id) {
    await supabase
      .from("people")
      .update({ is_repeat_participant: true })
      .eq("id", cand.person_id);
  }

  revalidatePath(`/studies/${studyId}`);
}
