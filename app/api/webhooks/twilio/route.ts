import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { normalizePhone } from "@/lib/people-fields";

/**
 * Inbound SMS webhook (set this URL in your Twilio number's messaging config).
 * Handles opt-out keywords (STOP/UNSUBSCRIBE/etc.) by flipping the person's SMS
 * opt-in off, and logs the inbound message. Replies with empty TwiML.
 */

const STOP_WORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
]);

function twiml(body = ""): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return twiml();

  let from = "";
  let text = "";
  try {
    const form = await req.formData();
    from = String(form.get("From") ?? "");
    text = String(form.get("Body") ?? "").trim();
  } catch {
    return twiml();
  }
  if (!from) return twiml();

  const phone = normalizePhone(from);
  const supabase = createAdminClient();

  const { data: person } = await supabase
    .from("people")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  // Log the inbound message (best-effort).
  await supabase.from("messages").insert({
    person_id: person?.id ?? null,
    channel: "sms",
    direction: "inbound",
    body: text,
    status: "sent",
  });

  if (person?.id && STOP_WORDS.has(text.toLowerCase())) {
    await supabase
      .from("people")
      .update({ sms_opt_in: false })
      .eq("id", person.id);
  }

  return twiml();
}
