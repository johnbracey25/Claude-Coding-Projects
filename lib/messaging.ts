import {
  isEmailConfigured,
  isResendConfigured,
  isSmsConfigured,
} from "./config";

/**
 * Pick the channel to use for a person, honoring a per-message preference
 * (short/urgent messages prefer SMS; content-rich messages prefer email). We
 * only pick a channel that is BOTH permitted (has contact info + opt-in) AND
 * configured; otherwise we fall back to the other channel so a message is never
 * silently dropped.
 */
export function chooseChannel(opts: {
  email?: string | null;
  phone?: string | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  prefer?: "email" | "sms";
}): "email" | "sms" | null {
  const wantEmail = !!opts.email && opts.emailOptIn;
  const wantSms = !!opts.phone && opts.smsOptIn;
  const emailReady = wantEmail && isEmailConfigured;
  const smsReady = wantSms && isSmsConfigured;

  const prefer = opts.prefer ?? "sms";
  if (prefer === "email") {
    if (emailReady) return "email";
    if (smsReady) return "sms";
  } else {
    if (smsReady) return "sms";
    if (emailReady) return "email";
  }
  // Nothing configured for their channels — return one they have so the attempt
  // is logged as "skipped" (visible to staff) rather than dropped.
  if (prefer === "email") {
    if (wantEmail) return "email";
    if (wantSms) return "sms";
  } else {
    if (wantSms) return "sms";
    if (wantEmail) return "email";
  }
  return null;
}

/**
 * Email (Resend) + SMS (Twilio) senders, called over each provider's REST API
 * so we don't pull in heavy SDKs. Both degrade gracefully: if the provider
 * isn't configured yet, they return { ok: false, skipped: true } instead of
 * throwing, so the rest of the flow (logging, status updates) still runs during
 * setup.
 */

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  providerId?: string;
  error?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  if (!isEmailConfigured) return { ok: false, skipped: true };
  // Prefer Resend when configured (needs a domain); otherwise send via SMTP
  // (e.g. Gmail with an app password), which needs no domain.
  if (isResendConfigured) return sendViaResend(opts);
  return sendViaSmtp(opts);
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    return { ok: true, providerId: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  try {
    // Imported lazily so the edge/runtime bundle stays lean.
    const nodemailer = (await import("nodemailer")).default;
    const from =
      process.env.EMAIL_FROM || process.env.SMTP_USER || "";
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true, providerId: info.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export async function sendSms(opts: {
  to: string;
  body: string;
}): Promise<SendResult> {
  if (!isSmsConfigured) return { ok: false, skipped: true };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_FROM_NUMBER!,
          To: opts.to,
          Body: opts.body,
        }),
      }
    );
    const json = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: json.message ?? `HTTP ${res.status}` };
    return { ok: true, providerId: json.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
