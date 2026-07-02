import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { normalizePhone, normalizeDate } from "@/lib/people-fields";
import type { PersonInput } from "@/lib/types";

/**
 * Public self-signup endpoint for the recruitment page (/join). No auth — it's
 * meant to be hit by anyone who follows a shared link. Writes via the
 * service-role client. Protected by a honeypot field and required-field
 * validation; de-duplicates on email/phone so repeat submissions update rather
 * than duplicate a person.
 */

interface SignupBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  wears_contacts?: boolean;
  had_cataract_surgery?: "yes" | "no" | "unsure" | "";
  eye_conditions?: string[];
  notes?: string;
  consent?: boolean;
  source?: string;
  /** Honeypot — must stay empty. Bots fill it. */
  website?: string;
}

const SOURCE_RE = /^[a-z0-9_-]{1,40}$/i;

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Signups aren't enabled yet. Please check back soon." },
      { status: 503 }
    );
  }

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot: pretend success so bots don't learn anything.
  if (body.website && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const first = (body.first_name ?? "").trim();
  const last = (body.last_name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase() || null;
  const phone = body.phone ? normalizePhone(body.phone) : null;

  if (!first && !last) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 }
    );
  }
  if (!email && !phone) {
    return NextResponse.json(
      { error: "Please provide an email or phone number so we can reach you." },
      { status: 400 }
    );
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "That email address doesn't look right." },
      { status: 400 }
    );
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: "Please check the box to agree to be contacted." },
      { status: 400 }
    );
  }

  const source =
    body.source && SOURCE_RE.test(body.source) ? body.source : "public_signup";

  const eyeConditions = Array.isArray(body.eye_conditions)
    ? body.eye_conditions.filter((c) => typeof c === "string").slice(0, 30)
    : [];
  const tags = body.wears_contacts ? ["contact_lens_wearer"] : [];

  const values: PersonInput = {
    first_name: first,
    last_name: last,
    email,
    phone,
    date_of_birth: body.date_of_birth ? normalizeDate(body.date_of_birth) : null,
    had_cataract_surgery:
      body.had_cataract_surgery === "yes"
        ? true
        : body.had_cataract_surgery === "no"
          ? false
          : null,
    eye_conditions: eyeConditions,
    tags,
    notes: (body.notes ?? "").trim() || null,
    email_opt_in: true,
    sms_opt_in: !!phone,
    consent_to_contact: true,
    status: "active",
    source,
    signed_up_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();

  // Look for an existing person by email or phone to avoid duplicates.
  try {
    let existingId: string | null = null;
    if (email) {
      const { data } = await supabase
        .from("people")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      existingId = data?.id ?? null;
    }
    if (!existingId && phone) {
      const { data } = await supabase
        .from("people")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    if (existingId) {
      // Merge: refresh consent + any newly provided screening info.
      const { error } = await supabase
        .from("people")
        .update({ ...values, signed_up_at: values.signed_up_at })
        .eq("id", existingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("people").insert(values);
      if (error) throw error;
    }
  } catch (e) {
    return NextResponse.json(
      {
        error:
          "Something went wrong saving your info. Please try again in a moment.",
        detail: e instanceof Error ? e.message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
