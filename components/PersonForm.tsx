import { savePerson } from "@/app/people/actions";
import type { Person } from "@/lib/types";

/** Create/edit form for a person. Submits to the savePerson server action. */
export default function PersonForm({ person }: { person?: Person }) {
  const rxValue = person?.contact_rx
    ? typeof person.contact_rx === "object"
      ? JSON.stringify(person.contact_rx)
      : String(person.contact_rx)
    : "";

  return (
    <form action={savePerson} className="mt-6 space-y-5">
      {person && <input type="hidden" name="id" value={person.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input name="first_name" defaultValue={person?.first_name ?? ""} className={input} />
        </Field>
        <Field label="Last name">
          <input name="last_name" defaultValue={person?.last_name ?? ""} className={input} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={person?.email ?? ""} className={input} />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={person?.phone ?? ""} className={input} />
        </Field>
        <Field label="Date of birth">
          <input
            name="date_of_birth"
            type="date"
            defaultValue={person?.date_of_birth ?? ""}
            className={input}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={person?.status ?? "active"} className={input}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="do_not_contact">Do not contact</option>
          </select>
        </Field>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-600">
          Eye profile
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Had cataract surgery">
            <select
              name="had_cataract_surgery"
              defaultValue={
                person?.had_cataract_surgery === true
                  ? "yes"
                  : person?.had_cataract_surgery === false
                    ? "no"
                    : ""
              }
              className={input}
            >
              <option value="">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Contact Rx (text or JSON)">
            <input name="contact_rx" defaultValue={rxValue} className={input} />
          </Field>
          <Field label="Eye conditions (comma-separated)">
            <input
              name="eye_conditions"
              defaultValue={(person?.eye_conditions ?? []).join(", ")}
              className={input}
            />
          </Field>
          <Field label="Ocular health issues (comma-separated)">
            <input
              name="ocular_health_issues"
              defaultValue={(person?.ocular_health_issues ?? []).join(", ")}
              className={input}
            />
          </Field>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tags (comma-separated)">
          <input name="tags" defaultValue={(person?.tags ?? []).join(", ")} className={input} />
        </Field>
        <Field label="Source">
          <input name="source" defaultValue={person?.source ?? ""} className={input} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea name="notes" defaultValue={person?.notes ?? ""} rows={3} className={input} />
      </Field>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="email_opt_in"
            defaultChecked={person ? person.email_opt_in : true}
          />
          Email opt-in
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="sms_opt_in"
            defaultChecked={person ? person.sms_opt_in : true}
          />
          SMS opt-in
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_repeat_participant"
            defaultChecked={person ? person.is_repeat_participant : false}
          />
          Repeat participant
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {person ? "Save changes" : "Create person"}
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
