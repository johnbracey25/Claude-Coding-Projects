export type PersonStatus = "active" | "inactive" | "do_not_contact";

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date (YYYY-MM-DD)
  email_opt_in: boolean;
  sms_opt_in: boolean;
  status: PersonStatus;
  contact_rx: Record<string, unknown> | null;
  eye_conditions: string[];
  had_cataract_surgery: boolean | null;
  ocular_health_issues: string[];
  source: string | null;
  tags: string[];
  notes: string | null;
  last_screened_at: string | null;
  consent_to_contact: boolean;
  signed_up_at: string | null;
  is_repeat_participant: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape accepted when creating/importing a person (server fills the rest). */
export type PersonInput = Partial<
  Omit<Person, "id" | "created_at" | "updated_at">
>;

// ── Studies ────────────────────────────────────────────────────────────────

export type StudyStatus = "draft" | "recruiting" | "closed";

export interface VisitDef {
  name: string;
  duration_min: number;
  /** Required gap from the PRIOR visit (visit 1 ignores these). */
  min_gap_days?: number;
  max_gap_days?: number;
}

export interface VisitPlan {
  visits: VisitDef[];
}

export interface Study {
  id: string;
  name: string;
  description: string | null;
  status: StudyStatus;
  location: string | null;
  start_window: string | null;
  end_window: string | null;
  eligibility_rules: { all: unknown[] };
  visit_plan: VisitPlan;
  compensation: string | null;
  address: string | null;
  prep_instructions: string | null;
  buffer_min: number;
  min_lead_hours: number;
  created_at: string;
  updated_at: string;
}

export type CandidateStatus =
  | "eligible"
  | "invited"
  | "responded"
  | "booked"
  | "completed"
  | "declined"
  | "ineligible";

export interface Candidate {
  id: string;
  study_id: string;
  person_id: string;
  status: CandidateStatus;
  reasons: unknown;
  matched_at: string;
  invited_at: string | null;
  responded_at: string | null;
  notes: string | null;
  token: string;
  response: string | null;
}

export interface AvailabilityWindow {
  id: string;
  label: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  source: "manual" | "google";
  google_event_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  candidate_id: string | null;
  person_id: string | null;
  study_id: string | null;
  visit_number: number;
  visit_name: string | null;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  location: string | null;
  google_event_id: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  person_id: string | null;
  candidate_id: string | null;
  channel: "email";
  direction: "outbound" | "inbound";
  subject: string | null;
  body: string | null;
  status: "sent" | "failed" | "skipped";
  provider_id: string | null;
  error: string | null;
  created_at: string;
}
