import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured, appUrl } from "@/lib/config";
import { normalizePhone, normalizeDate } from "@/lib/people-fields";
import { sendEmail } from "@/lib/messaging";
import { welcome } from "@/lib/templates";
import type { PersonInput } from "@/lib/types";

/**
 * Public self-signup endpoint for the recruitment page (/join). No auth — it's
 * meant to be hit by anyone who follows a shared link. Writes via the
 * service-role client. Protected by a honeypot field and required-field
 * validation; de-duplicates on email/phone so repeat submissions update rather
 * than duplicate a person.
 */

interface EyeRxInput {
  sphere?: string;
  cylinder?: string;
  axis?: string;
}

interface SignupBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  wears_contacts?: boolean;
  contact_rx?: {
    od?: EyeRxInput | null;
    os?: EyeRxInput | null;
  } | null;
  had_cataract_surgery?: "yes" | "no" | "";
  eye_conditions?: string[];
  notes?: string;
  consent?: boolean;
  source?: string;
  /** Honeypot: must stay empty. Bots fill it. */
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
  if (!email) {
    return NextResponse.json(
      { error: "Please enter your email address." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "That email address doesn't look right." },
      { status: 400 }
    );
  }
  if (!phone) {
    return NextResponse.json(
      { error: "Please enter your mobile phone number." },
      { status: 400 }
    );
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: "Please check the box to agree to be contacted." },
      { status: 400 }
    );
  }

  // Date of birth is required.
  const dob = body.date_of_birth ? normalizeDate(body.date_of_birth) : null;
  if (!dob) {
    return NextResponse.json(
      { error: "Please enter your date of birth." },
      { status: 400 }
    );
  }

  // Cataract surgery answer is required (must be yes or no).
  if (body.had_cataract_surgery !== "yes" && body.had_cataract_surgery !== "no") {
    return NextResponse.json(
      { error: "Please tell us whether you've had cataract surgery." },
      { status: 400 }
    );
  }

  const source =
    body.source && SOURCE_RE.test(body.source) ? body.source : "public_signup";

  const eyeConditions = Array.isArray(body.eye_conditions)
    ? body.eye_conditions.filter((c) => typeof c === "string").slice(0, 30)
    : [];
  const tags = body.wears_contacts ? ["contact_lens_wearer"] : [];

  // Structured contact-lens prescription (per eye: sphere/cylinder/axis).
  const od = sanitizeEye(body.contact_rx?.od);
  const os = sanitizeEye(body.contact_rx?.os);
  const contactRx = body.wears_contacts && (od || os) ? { od, os } : null;

  const values: PersonInput = {
    first_name: first,
    last_name: last,
    email,
    phone,
    date_of_birth: dob,
    had_cataract_surgery: body.had_cataract_surgery === "yes",
    contact_rx: contactRx,
    eye_conditions: eyeConditions,
    tags,
    notes: (body.notes ?? "").trim() || null,
    email_opt_in: true,
    consent_to_contact: true,
    status: "active",
    source,
    signed_up_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();

  let personId: string | null = null;
  let isNewSignup = false;

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
      // Check if this record was archived (deleted) -- if so, treat as a
      // fresh signup so they get a welcome email again.
      const { data: existing } = await supabase
        .from("people")
        .select("archived_at")
        .eq("id", existingId)
        .single();
      const wasArchived = !!existing?.archived_at;

      const updates: Record<string, unknown> = {
        ...omitEmpty({
          first_name: first,
          last_name: last,
          email,
          phone,
          date_of_birth: dob,
          had_cataract_surgery: values.had_cataract_surgery,
          contact_rx: contactRx,
          eye_conditions: eyeConditions,
          tags,
          notes: values.notes,
        }),
        email_opt_in: true,
        consent_to_contact: true,
        status: "active",
        source,
        signed_up_at: values.signed_up_at,
        archived_at: null,
      };
      const { error } = await supabase
        .from("people")
        .update(updates)
        .eq("id", existingId);
      if (error) throw error;
      personId = existingId;
      if (wasArchived) isNewSignup = true;
    } else {
      const { data, error } = await supabase
        .from("people")
        .insert(values)
        .select("id")
        .single();
      if (error) throw error;
      personId = data.id;
      isNewSignup = true;
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

  // Send a personal welcome from Dr. Hacker on brand-new signups (best-effort;
  // never fails the signup). Repeat submissions don't re-trigger it.
  if (isNewSignup && email) {
    const tpl = welcome(first, `${appUrl}/about`);
    try {
      const r = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await supabase.from("messages").insert({
        person_id: personId,
        channel: "email",
        subject: tpl.subject,
        body: tpl.text,
        status: r.ok ? "sent" : r.skipped ? "skipped" : "failed",
        provider_id: r.providerId ?? null,
        error: r.error ?? null,
      });
    } catch {
      // Welcome message failure must not affect the signup result.
    }
  }

  return NextResponse.json({ ok: true });
}

/** Keep only real sphere/cylinder/axis values; drop blanks and "Not sure". */
function sanitizeEye(
  input?: EyeRxInput | null
): { sphere?: string; cylinder?: string; axis?: string } | null {
  if (!input || typeof input !== "object") return null;
  const clean = (v?: string) => {
    const s = (v ?? "").toString().trim().slice(0, 8);
    return s && s.toLowerCase() !== "unknown" ? s : undefined;
  };
  const out: { sphere?: string; cylinder?: string; axis?: string } = {};
  const sphere = clean(input.sphere);
  const cylinder = clean(input.cylinder);
  const axis = clean(input.axis);
  if (sphere) out.sphere = sphere;
  if (cylinder) out.cylinder = cylinder;
  if (axis) out.axis = axis;
  return Object.keys(out).length ? out : null;
}

/** Drop keys whose value is null/undefined/""/[] (keeps false and 0). */
function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}
