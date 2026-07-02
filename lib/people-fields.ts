import type { PersonInput } from "./types";

/**
 * Canonical definition of importable/editable person fields. Drives the CSV
 * column mapper, auto-matching of headers, and value parsing. Keeping this in
 * one place means the importer and the edit form never drift apart.
 */

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "boolean"
  | "string_array"
  | "json";

export interface FieldDef {
  key: keyof PersonInput;
  label: string;
  type: FieldType;
  /** Lowercased header aliases used to auto-detect a column during import. */
  aliases: string[];
  help?: string;
}

export const PERSON_FIELDS: FieldDef[] = [
  { key: "first_name", label: "First name", type: "text", aliases: ["first name", "firstname", "first", "fname", "given name"] },
  { key: "last_name", label: "Last name", type: "text", aliases: ["last name", "lastname", "last", "lname", "surname", "family name"] },
  { key: "email", label: "Email", type: "email", aliases: ["email", "e-mail", "email address"] },
  { key: "phone", label: "Phone", type: "phone", aliases: ["phone", "phone number", "mobile", "cell", "telephone", "tel"] },
  { key: "date_of_birth", label: "Date of birth", type: "date", aliases: ["dob", "date of birth", "birthdate", "birthday"] },
  { key: "had_cataract_surgery", label: "Had cataract surgery", type: "boolean", aliases: ["cataract surgery", "had cataract surgery", "cataract"] },
  { key: "eye_conditions", label: "Eye conditions", type: "string_array", aliases: ["eye conditions", "conditions", "eye condition"], help: "Comma- or semicolon-separated" },
  { key: "ocular_health_issues", label: "Ocular health issues", type: "string_array", aliases: ["ocular health issues", "ocular issues", "health issues"], help: "Empty means none" },
  { key: "contact_rx", label: "Contact Rx", type: "json", aliases: ["contact rx", "prescription", "rx", "contact prescription"], help: "Free text or JSON" },
  { key: "tags", label: "Tags", type: "string_array", aliases: ["tags", "labels", "groups"] },
  { key: "source", label: "Source", type: "text", aliases: ["source", "origin", "referral"] },
  { key: "notes", label: "Notes", type: "text", aliases: ["notes", "comments", "comment"] },
  { key: "email_opt_in", label: "Email opt-in", type: "boolean", aliases: ["email opt in", "email opt-in", "email consent"] },
  { key: "sms_opt_in", label: "SMS opt-in", type: "boolean", aliases: ["sms opt in", "sms opt-in", "text consent", "text opt in"] },
];

const TRUTHY = new Set(["true", "yes", "y", "1", "t", "x", "✓"]);
const FALSY = new Set(["false", "no", "n", "0", "f", ""]);

/** Suggest a person field for a raw CSV header, or null if no confident match. */
export function autoMatchField(header: string): keyof PersonInput | null {
  const h = header.trim().toLowerCase();
  if (!h) return null;
  for (const f of PERSON_FIELDS) {
    if (f.label.toLowerCase() === h || f.aliases.includes(h)) return f.key;
  }
  // Loose contains-match as a fallback.
  for (const f of PERSON_FIELDS) {
    if (f.aliases.some((a) => h.includes(a) || a.includes(h))) return f.key;
  }
  return null;
}

/** Parse a raw string cell into the typed value for a given field. */
export function parseValue(
  type: FieldType,
  raw: string
): string | boolean | string[] | Record<string, unknown> | null {
  const v = (raw ?? "").trim();
  switch (type) {
    case "boolean": {
      const low = v.toLowerCase();
      if (TRUTHY.has(low)) return true;
      if (FALSY.has(low)) return false;
      return null;
    }
    case "string_array":
      return v
        ? v.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
        : [];
    case "date":
      return normalizeDate(v);
    case "json": {
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return { raw: v }; // keep free-text Rx as-is
      }
    }
    case "phone":
      return v ? normalizePhone(v) : null;
    default:
      return v || null;
  }
}

/** Best-effort phone normalization toward E.164 (US-friendly). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}

/** Normalize common date formats to YYYY-MM-DD, or return null. */
export function normalizeDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // M/D/YYYY or MM/DD/YYYY
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, mm, dd, yyyy] = m;
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return null;
}
