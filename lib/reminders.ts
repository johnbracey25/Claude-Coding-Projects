import { createAdminClient } from "./supabase/admin";
import { sendEmail } from "./messaging";
import { preVisitEmail } from "./templates";
import { formatDateTime } from "./format";
import type { Study, Person, Appointment } from "./types";

export interface ReminderResult {
  ok: boolean;
  sent: number;
  error?: string;
}

interface DueRow extends Appointment {
  person: Person | null;
  study: Study | null;
}

export async function sendDueReminders(): Promise<ReminderResult> {
  const supabase = createAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, person:people(*), study:studies(*)")
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", horizon);
  if (error) return { ok: false, sent: 0, error: error.message };

  const rows = (data ?? []) as unknown as DueRow[];
  let sent = 0;

  for (const appt of rows) {
    const person = appt.person;
    const study = appt.study;
    if (!person || !study) continue;
    if (!person.email || !person.email_opt_in) continue;

    const whenLabel = formatDateTime(appt.starts_at);
    const tpl = preVisitEmail(person, study, whenLabel, appt.visit_name);
    const result = await sendEmail({
      to: person.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });

    await supabase.from("messages").insert({
      person_id: person.id,
      candidate_id: appt.candidate_id,
      channel: "email",
      subject: tpl.subject,
      body: tpl.text,
      status: result.ok ? "sent" : result.skipped ? "skipped" : "failed",
      provider_id: result.providerId ?? null,
      error: result.error ?? null,
    });

    if (result.ok) {
      await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appt.id);
      sent += 1;
    }
  }

  return { ok: true, sent };
}
