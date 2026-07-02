import { appUrl } from "./config";
import type { Person, Study, Candidate } from "./types";

/**
 * Invite message templates. Each invite links to a public response page
 * (/r/<token>) where the person says whether they're interested. Keep copy
 * short and friendly — SMS especially.
 */

export function responseUrl(candidate: Pick<Candidate, "token">): string {
  return `${appUrl}/r/${candidate.token}`;
}

export function unsubscribeUrl(candidate: Pick<Candidate, "token">): string {
  return `${appUrl}/api/unsubscribe?c=${candidate.token}`;
}

function firstName(person: Person): string {
  return person.first_name?.trim() || "there";
}

export function inviteEmail(
  person: Person,
  study: Study,
  candidate: Candidate
): { subject: string; html: string; text: string } {
  const link = responseUrl(candidate);
  const unsub = unsubscribeUrl(candidate);
  const comp = study.compensation
    ? ` Participants receive ${study.compensation}.`
    : "";
  const subject = `You may qualify for a study: ${study.name}`;
  const text =
    `Hi ${firstName(person)},\n\n` +
    `Based on what you told us, you may be a good fit for our study "${study.name}".${comp}\n\n` +
    `If you're interested, let us know here: ${link}\n\n` +
    `Thanks,\nEve Research\n\n` +
    `Don't want these emails? Unsubscribe: ${unsub}`;
  const html =
    `<p>Hi ${firstName(person)},</p>` +
    `<p>Based on what you told us, you may be a good fit for our study <strong>${study.name}</strong>.${comp}</p>` +
    `<p><a href="${link}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">I'm interested →</a></p>` +
    `<p>Thanks,<br/>Eve Research</p>` +
    `<p style="color:#94a3b8;font-size:12px">Don't want these emails? <a href="${unsub}">Unsubscribe</a>.</p>`;
  return { subject, html, text };
}

export function inviteSms(
  person: Person,
  study: Study,
  candidate: Candidate
): string {
  const link = responseUrl(candidate);
  return (
    `Hi ${firstName(person)}, it's Eve Research. You may qualify for our study "${study.name}". ` +
    `Interested? ${link} (Reply STOP to opt out)`
  );
}
