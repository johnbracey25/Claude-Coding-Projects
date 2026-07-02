"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runMatching } from "@/lib/studies";
import { sendEmail, sendSms } from "@/lib/messaging";
import { inviteEmail, inviteSms } from "@/lib/templates";
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

interface CandidateJoined extends Candidate {
  person: Person;
  study: Study;
}

/**
 * Invite one candidate: pick a channel (email if they have/allow it, else SMS),
 * send the invite, log it, and advance status to 'invited' on success.
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

  const canEmail = !!person.email && person.email_opt_in;
  const canSms = !!person.phone && person.sms_opt_in;

  let channel: "email" | "sms" | null = null;
  let result;
  let subject: string | null = null;
  let body: string | null = null;

  if (canEmail) {
    channel = "email";
    const tpl = inviteEmail(person, study, cand);
    subject = tpl.subject;
    body = tpl.text;
    result = await sendEmail({
      to: person.email!,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } else if (canSms) {
    channel = "sms";
    body = inviteSms(person, study, cand);
    result = await sendSms({ to: person.phone!, body });
  }

  if (!channel || !result) {
    await supabase.from("messages").insert({
      person_id: person.id,
      candidate_id: cand.id,
      channel: "email",
      status: "skipped",
      error: "No contactable channel (missing contact info or opt-out).",
    });
    return "skipped";
  }

  const status = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
  await supabase.from("messages").insert({
    person_id: person.id,
    candidate_id: cand.id,
    channel,
    subject,
    body,
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
  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId);
  if (error) throw new Error(error.message);
  revalidatePath(`/studies/${studyId}`);
}
