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

export function welcome(
  firstNameRaw: string,
  bioUrl: string
): { subject: string; html: string; text: string; sms: string } {
  const name = firstNameRaw?.trim() || "there";
  const subject = "Welcome to Eve Research, a note from Dr. Lauren Hacker";
  const text =
    `Hi ${name},\n\n` +
    `Thank you for adding your name to the Eve Research study list. I'm Dr. Lauren ` +
    `Hacker, and I lead the eye-research studies here.\n\n` +
    `When a study comes up that you may be a good fit for, I'll reach out personally ` +
    `with the details and a link to choose a time that works for you. There's no ` +
    `obligation, and you can opt out anytime.\n\n` +
    `You can learn a little about me and Eve Research here: ${bioUrl}\n\n` +
    `Warmly,\nDr. Lauren Hacker\nEve Research`;
  const html =
    `<p>Hi ${name},</p>` +
    `<p>Thank you for adding your name to the Eve Research study list. I'm ` +
    `Dr. Lauren Hacker, and I lead the eye-research studies here.</p>` +
    `<p>When a study comes up that you may be a good fit for, I'll reach out ` +
    `personally with the details and a link to choose a time that works for you. ` +
    `There's no obligation, and you can opt out anytime.</p>` +
    `<p>You can learn a little about me and Eve Research ` +
    `<a href="${bioUrl}">here</a>.</p>` +
    `<p>Warmly,<br/>Dr. Lauren Hacker<br/>Eve Research</p>`;
  const sms =
    `Hi ${name}, this is Dr. Lauren Hacker with Eve Research. Thank you for joining ` +
    `our study list! When a study you may be a good fit for comes up, I'll reach out ` +
    `personally. A little about me and our work: ${bioUrl}. Reply STOP to opt out.`;
  return { subject, html, text, sms };
}

/**
 * Day-before pre-visit email: the details packet (address + map, what to bring,
 * study info). Rich content, so it goes by email.
 */
export function preVisitEmail(
  person: Person,
  study: Study,
  whenLabel: string,
  visitName: string | null
): { subject: string; html: string; text: string } {
  const name = firstName(person);
  const where = study.address || study.location || "";
  const mapUrl = where
    ? `https://maps.google.com/?q=${encodeURIComponent(where)}`
    : "";
  const prep = study.prep_instructions?.trim();

  const subject = `Reminder: your ${study.name} visit is tomorrow`;

  const textParts = [
    `Hi ${name},`,
    ``,
    `This is a friendly reminder about your upcoming visit for "${study.name}".`,
    ``,
    `${visitName ? visitName + ": " : ""}${whenLabel}`,
  ];
  if (where) textParts.push(``, `Where: ${where}`);
  if (mapUrl) textParts.push(`Map: ${mapUrl}`);
  if (prep) textParts.push(``, `What to know: ${prep}`);
  if (study.compensation) textParts.push(``, `Compensation: ${study.compensation}`);
  textParts.push(
    ``,
    `If you can no longer make it, please reply to let us know.`,
    ``,
    `See you then,`,
    `Dr. Lauren Hacker`,
    `Eve Research`
  );
  const text = textParts.join("\n");

  const html =
    `<p>Hi ${name},</p>` +
    `<p>This is a friendly reminder about your upcoming visit for <strong>${study.name}</strong>.</p>` +
    `<p style="font-size:16px"><strong>${visitName ? visitName + ": " : ""}${whenLabel}</strong></p>` +
    (where
      ? `<p><strong>Where:</strong> ${where}` +
        (mapUrl ? ` &middot; <a href="${mapUrl}">Open map</a>` : "") +
        `</p>`
      : "") +
    (prep ? `<p><strong>What to know:</strong> ${prep}</p>` : "") +
    (study.compensation
      ? `<p><strong>Compensation:</strong> ${study.compensation}</p>`
      : "") +
    `<p>If you can no longer make it, please reply to let us know.</p>` +
    `<p>See you then,<br/>Dr. Lauren Hacker<br/>Eve Research</p>`;

  return { subject, html, text };
}

export function bookingConfirmation(
  person: Person,
  study: Study,
  visitLines: string[]
): { subject: string; html: string; text: string; sms: string } {
  const subject = `Your ${study.name} visit is booked`;
  const listText = visitLines.map((l) => `  - ${l}`).join("\n");
  const listHtml = visitLines.map((l) => `<li>${l}</li>`).join("");
  const where = study.location ? `\nLocation: ${study.location}` : "";
  const text =
    `Hi ${firstName(person)},\n\nYou're booked for "${study.name}". Here are your visit times:\n` +
    `${listText}${where}\n\nThank you,\nEve Research`;
  const html =
    `<p>Hi ${firstName(person)},</p>` +
    `<p>You're booked for <strong>${study.name}</strong>. Your visit times:</p>` +
    `<ul>${listHtml}</ul>` +
    (study.location ? `<p>Location: ${study.location}</p>` : "") +
    `<p>Thank you,<br/>Eve Research</p>`;
  const sms =
    `Eve Research: you're booked for "${study.name}". ` +
    visitLines.join("; ") +
    (study.location ? ` at ${study.location}` : "");
  return { subject, html, text, sms };
}
