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
  created_at: string;
  updated_at: string;
}

/** Shape accepted when creating/importing a person (server fills the rest). */
export type PersonInput = Partial<
  Omit<Person, "id" | "created_at" | "updated_at">
>;
