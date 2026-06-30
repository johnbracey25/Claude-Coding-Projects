import { isEmailConfigured, isSmsConfigured } from "./config";

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
