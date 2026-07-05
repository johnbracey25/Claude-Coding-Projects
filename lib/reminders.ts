import { createAdminClient } from "./supabase/admin";
import { sendEmail, sendSms, chooseChannel } from "./messaging";
import { preVisitEmail } from "./templates";
import { formatDateTime } from "./format";
import type { Study, Person, Appointment } from "./types";

/**
 * Sends the day-before "details packet" for upcoming visits. Runs from the
 * daily cron. Each appointment is reminded at most once (reminder_sent_at), so
 * participants never get bombarded. Rich details go by email; if we only have a
 * phone, a short text is sent instead.
 */

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

    const whenLabel = formatDateTime(appt.starts_at);
    const channel = chooseChannel({
      email: person.email,
      phone: person.phone,
      emailOptIn: person.email_opt_in,
      smsOptIn: person.sms_opt_in,
      prefer: "email",
    });

    let result;
    let subject: string | null = null;
    let body: string | null = null;

    if (channel === "email" && person.email) {
      const tpl = preVisitEmail(person, study, whenLabel, appt.visit_name);
      subject = tpl.subject;
      body = tpl.text;
      result = await sendEmail({
        to: person.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } else if (channel === "sms" && person.phone) {
      const where = study.address || study.location || "";
      body =
        `Reminder from Eve Research: your "${study.name}" visit is ${whenLabel}` +
        (where ? ` at ${where}` : "") +
        `. Reply to this text if you can't make it.`;
      result = await sendSms({ to: person.phone, body });
    }

    if (result) {
      await supabase.from("messages").insert({
        person_id: person.id,
        candidate_id: appt.candidate_id,
        channel: channel === "email" ? "email" : "sms",
        subject,
        body,
        status: result.ok ? "sent" : result.skipped ? "skipped" : "failed",
        provider_id: result.providerId ?? null,
        error: result.error ?? null,
      });
      // Mark as reminded only on a real send, so a failure can retry next run.
      if (result.ok) {
        await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appt.id);
        sent += 1;
      }
    }
  }

  return { ok: true, sent };
}
