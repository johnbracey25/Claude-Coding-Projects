import { appUrl } from "./config";
import type { Person, Study, Candidate } from "./types";

function emailLayout(bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f6f4ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f4ee">
  <tr><td style="padding:24px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
      ${bodyRows}
      <tr>
        <td style="padding:24px 32px 32px;text-align:center">
          <p style="margin:0;font-size:12px;color:#94a3b8">Eve Research &middot; Athens, Georgia</p>
          <p style="margin:4px 0 0;font-size:12px;color:#94a3b8"><a href="https://eve-research.com" style="color:#90a687;text-decoration:none">eve-research.com</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

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
  const subject = `You may qualify for a study: ${study.name}`;
  const text =
    `Hi ${firstName(person)},\n\n` +
    `Based on what you told us, you may be a good fit for our study "${study.name}".\n\n` +
    (study.description ? `${study.description}\n\n` : "") +
    (study.compensation ? `Compensation: ${study.compensation}\n\n` : "") +
    `If you're interested, let us know here and tell us your general availability. ` +
    `We'll give you a call to find a visit time that works — there's nothing to ` +
    `schedule online right now:\n${link}\n\n` +
    `Thanks,\nEve Research\n\n` +
    `Don't want these emails? Unsubscribe: ${unsub}`;
  const html = emailLayout(`
    <tr>
      <td style="padding:36px 32px 28px;text-align:center;background:#152b3e">
        <img src="https://eve-research.com/eve-research-logo.png" alt="Eve Research" width="68" height="68" style="display:block;margin:0 auto 12px;border-radius:14px" />
        <p style="margin:0;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.01em">Eve Research</p>
        <p style="margin:4px 0 0;font-size:13px;color:#9db3c7">You may qualify for a study</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px 0">
        <p style="margin:0;font-size:16px;line-height:26px;color:#334155">Hi ${firstName(person)},</p>
        <p style="margin:16px 0 0;font-size:16px;line-height:26px;color:#334155">
          Based on what you told us, you may be a good fit for our study
          <strong style="color:#152b3e">${study.name}</strong>.
        </p>
        ${
          study.description
            ? `<p style="margin:14px 0 0;font-size:15px;line-height:24px;color:#475569">${study.description}</p>`
            : ""
        }
      </td>
    </tr>
    ${
      study.compensation
        ? `<tr>
      <td style="padding:20px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f4ee;border-radius:12px">
          <tr>
            <td style="padding:16px 20px">
              <p style="margin:0 0 2px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6f8767">Compensation</p>
              <p style="margin:0;font-size:16px;line-height:24px;color:#152b3e">${study.compensation}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
        : ""
    }
    <tr>
      <td style="padding:24px 32px 0;text-align:center">
        <a href="${link}" style="display:inline-block;background:#1f3d57;color:#ffffff;font-size:15px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none">I'm interested</a>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 32px 0">
        <p style="margin:0;font-size:14px;line-height:23px;color:#64748b;text-align:center">
          Tap above to let us know and share your general availability.
          We&rsquo;ll call you to set up a time &mdash; nothing to schedule online right now.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;line-height:24px;color:#334155">Thanks,<br/>Eve Research</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Don't want these emails? <a href="${unsub}" style="color:#90a687">Unsubscribe</a>.</p>
      </td>
    </tr>
  `);
  return { subject, html, text };
}

export function welcome(
  firstNameRaw: string,
  bioUrl: string
): { subject: string; html: string; text: string } {
  const name = firstNameRaw?.trim() || "there";
  const subject = "Welcome to Eve Research — a note from Dr. Lauren Hacker";
  const text =
    `Hi ${name},\n\n` +
    `Thank you for adding your name to the Eve Research study list. I'm Dr. Lauren ` +
    `Hacker, and I lead the eye-research studies here in Athens, Georgia.\n\n` +
    `Here's what happens next:\n\n` +
    `When a study comes up that you may be a good fit for, I'll reach out personally ` +
    `with the details. All studies are paid if you qualify, and there's no obligation ` +
    `to take part. You can opt out anytime.\n\n` +
    `You can learn a little about me and Eve Research here: ${bioUrl}\n\n` +
    `Warmly,\nDr. Lauren Hacker, O.D.\nFounder, Eve Research`;
  const html = emailLayout(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <img src="https://eve-research.com/eve-research-logo.png" alt="Eve Research" width="80" height="80" style="display:block;margin:0 auto;border-radius:16px" />
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;text-align:center">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#152b3e">Welcome to Eve Research</h1>
        <p style="margin:6px 0 0;font-size:14px;color:#64748b">A personal note from Dr. Lauren Hacker</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0;font-size:16px;line-height:26px;color:#334155">Hi ${name},</p>
        <p style="margin:16px 0 0;font-size:16px;line-height:26px;color:#334155">
          Thank you for adding your name to the Eve Research study list. I'm Dr. Lauren
          Hacker, and I lead the eye-research studies here in Athens, Georgia.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f4ee;border-radius:12px">
          <tr>
            <td style="padding:20px 24px">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6f8767">What happens next</p>
              <p style="margin:0;font-size:15px;line-height:24px;color:#334155">
                When a study comes up that you may be a good fit for, I'll reach out
                personally with the details. All studies are paid if you qualify, and
                there is no obligation to take part. You can opt out anytime.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;text-align:center">
        <a href="${bioUrl}" style="display:inline-block;background:#1f3d57;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">Learn about Eve Research</a>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid #e2e8f0;padding-top:20px">
              <p style="margin:0;font-size:15px;line-height:24px;color:#334155">Warmly,</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#152b3e">Dr. Lauren Hacker, O.D.</p>
              <p style="margin:2px 0 0;font-size:13px;color:#64748b">Founder, Eve Research</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
  return { subject, html, text };
}

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

  const detailRows: string[] = [];
  detailRows.push(`<tr><td style="padding:8px 0"><strong style="color:#152b3e">When:</strong> ${visitName ? visitName + " - " : ""}${whenLabel}</td></tr>`);
  if (where) {
    detailRows.push(`<tr><td style="padding:8px 0"><strong style="color:#152b3e">Where:</strong> ${where}${mapUrl ? ` &middot; <a href="${mapUrl}" style="color:#90a687">Open map</a>` : ""}</td></tr>`);
  }
  if (prep) {
    detailRows.push(`<tr><td style="padding:8px 0"><strong style="color:#152b3e">What to know:</strong> ${prep}</td></tr>`);
  }
  if (study.compensation) {
    detailRows.push(`<tr><td style="padding:8px 0"><strong style="color:#152b3e">Compensation:</strong> ${study.compensation}</td></tr>`);
  }

  const html = emailLayout(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <img src="https://eve-research.com/eve-research-logo.png" alt="Eve Research" width="60" height="60" style="display:block;margin:0 auto;border-radius:12px" />
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0;font-size:16px;line-height:26px;color:#334155">Hi ${name},</p>
        <p style="margin:16px 0 0;font-size:16px;line-height:26px;color:#334155">
          This is a friendly reminder about your upcoming visit for <strong style="color:#152b3e">${study.name}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f4ee;border-radius:12px">
          <tr>
            <td style="padding:16px 20px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:15px;line-height:22px;color:#334155">
                ${detailRows.join("")}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;line-height:24px;color:#334155">If you can no longer make it, please reply to let us know.</p>
        <p style="margin:16px 0 0;font-size:15px;line-height:24px;color:#334155">See you then,<br/><strong style="color:#152b3e">Dr. Lauren Hacker</strong><br/><span style="color:#64748b">Eve Research</span></p>
      </td>
    </tr>
  `);

  return { subject, html, text };
}

export function bookingConfirmation(
  person: Person,
  study: Study,
  visitLines: string[]
): { subject: string; html: string; text: string } {
  const subject = `Your ${study.name} visit is booked`;
  const listText = visitLines.map((l) => `  - ${l}`).join("\n");
  const listHtml = visitLines.map((l) => `<li>${l}</li>`).join("");
  const where = study.location ? `\nLocation: ${study.location}` : "";
  const text =
    `Hi ${firstName(person)},\n\nYou're booked for "${study.name}". Here are your visit times:\n` +
    `${listText}${where}\n\nThank you,\nEve Research`;
  const html = emailLayout(`
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <img src="https://eve-research.com/eve-research-logo.png" alt="Eve Research" width="60" height="60" style="display:block;margin:0 auto;border-radius:12px" />
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0;text-align:center">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#152b3e">You're booked!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0">
        <p style="margin:0;font-size:16px;line-height:26px;color:#334155">
          Hi ${firstName(person)}, you're confirmed for <strong style="color:#152b3e">${study.name}</strong>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0f4ee;border-radius:12px">
          <tr>
            <td style="padding:16px 20px">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6f8767">Your visit times</p>
              <ul style="margin:0;padding:0 0 0 18px;font-size:15px;line-height:26px;color:#334155">${listHtml}</ul>
              ${study.location ? `<p style="margin:12px 0 0;font-size:14px;color:#64748b">Location: ${study.location}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0;font-size:15px;line-height:24px;color:#334155">Thank you,<br/><strong style="color:#152b3e">Eve Research</strong></p>
      </td>
    </tr>
  `);
  return { subject, html, text };
}
