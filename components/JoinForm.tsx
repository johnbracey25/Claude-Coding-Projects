"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const EYE_CONDITIONS = [
  "Dry eye",
  "Glaucoma",
  "Cataracts",
  "Macular degeneration",
  "Diabetic retinopathy",
  "Keratoconus",
];

// Standard contact-lens sphere powers, +8.00 down to -12.00 in 0.25 steps.
const POWERS: string[] = (() => {
  const out: string[] = [];
  for (let q = 32; q >= -48; q--) {
    const v = q / 4;
    out.push(v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
  }
  return out;
})();

// Toric cylinder powers, -0.25 down to -6.00 in 0.25 steps (minus-cyl convention).
const CYLINDERS: string[] = (() => {
  const out: string[] = [];
  for (let q = -1; q >= -24; q--) out.push((q / 4).toFixed(2));
  return out;
})();

// Axis in 10-degree steps (standard toric contact-lens availability).
const AXES: string[] = (() => {
  const out: string[] = [];
  for (let a = 10; a <= 180; a += 10) out.push(String(a));
  return out;
})();

interface EyeRx {
  sphere: string;
  cylinder: string;
  axis: string;
}
const EMPTY_RX: EyeRx = { sphere: "", cylinder: "", axis: "" };

/** Keep only the filled sub-fields, or null if nothing meaningful set. */
function eyePayload(rx: EyeRx): Record<string, string> | null {
  const o: Record<string, string> = {};
  if (rx.sphere) o.sphere = rx.sphere;
  if (rx.cylinder) o.cylinder = rx.cylinder;
  if (rx.axis) o.axis = rx.axis;
  return Object.keys(o).length ? o : null;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function JoinForm() {
  const params = useSearchParams();
  const source = params.get("src") ?? params.get("source") ?? undefined;

  const [conditions, setConditions] = useState<string[]>([]);
  const [wearsContacts, setWearsContacts] = useState("");
  const [odRx, setOdRx] = useState<EyeRx>(EMPTY_RX);
  const [osRx, setOsRx] = useState<EyeRx>(EMPTY_RX);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const wears = wearsContacts === "yes";

    if (wears && (!odRx.sphere || !osRx.sphere)) {
      setError("Please select your contact lens power for both eyes.");
      return;
    }

    setBusy(true);
    const payload = {
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      date_of_birth: String(fd.get("date_of_birth") ?? ""),
      wears_contacts: wears,
      contact_rx: wears
        ? { od: eyePayload(odRx), os: eyePayload(osRx) }
        : null,
      had_cataract_surgery: String(fd.get("had_cataract_surgery") ?? "") as
        | "yes"
        | "no"
        | "",
      eye_conditions: conditions,
      notes: String(fd.get("notes") ?? ""),
      consent: fd.get("consent") === "on",
      website: String(fd.get("website") ?? ""), // honeypot
      source,
    };

    try {
      const res = await fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  function renderEye(
    label: string,
    rx: EyeRx,
    setRx: (rx: EyeRx) => void
  ) {
    const hasCyl = !!rx.cylinder && rx.cylinder !== "unknown";
    return (
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Power (sphere)</span>
            <select
              required
              value={rx.sphere}
              onChange={(e) => setRx({ ...rx, sphere: e.target.value })}
              className={inputCls}
            >
              <option value="">Choose...</option>
              <option value="unknown">Not sure</option>
              {POWERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Cylinder</span>
            <select
              value={rx.cylinder}
              onChange={(e) => {
                const c = e.target.value;
                setRx({ ...rx, cylinder: c, axis: c && c !== "unknown" ? rx.axis : "" });
              }}
              className={inputCls}
            >
              <option value="">None</option>
              <option value="unknown">Not sure</option>
              {CYLINDERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Axis</span>
            <select
              value={rx.axis}
              disabled={!hasCyl}
              onChange={(e) => setRx({ ...rx, axis: e.target.value })}
              className={`${inputCls} disabled:bg-slate-100 disabled:text-slate-400`}
            >
              <option value="">{hasCyl ? "Choose..." : "N/A"}</option>
              {AXES.map((a) => (
                <option key={a} value={a}>{a}°</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-800">You&apos;re on the list! 🎉</h2>
        <p className="mt-2 text-emerald-700">
          Thanks for your interest in Eve Research. We&apos;ll reach out by email
          when there&apos;s a study you may be a good fit for.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Honeypot: hidden from people, tempting to bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            First name
          </span>
          <input
            name="first_name"
            required
            autoComplete="given-name"
            autoCapitalize="words"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Last name
          </span>
          <input
            name="last_name"
            required
            autoComplete="family-name"
            autoCapitalize="words"
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          pattern="[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}"
          title="Please enter a valid email address"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Mobile phone
        </span>
        <input
          name="phone"
          type="tel"
          required
          pattern="[\d\s\-\(\)\+]{10,}"
          title="Please enter a valid 10-digit phone number"
          inputMode="tel"
          autoComplete="tel"
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Date of birth
        </span>
        <input
          name="date_of_birth"
          type="date"
          required
          autoComplete="bday"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Used to match you to studies with age requirements.
        </span>
      </label>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-600">
          A few quick eye questions
        </legend>

        <div className="mt-2">
          <span className="text-sm font-medium text-slate-700">
            Do you wear contact lenses?
          </span>
          <select
            required
            value={wearsContacts}
            onChange={(e) => setWearsContacts(e.target.value)}
            className={`mt-1 ${inputCls}`}
          >
            <option value="">Please choose...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {wearsContacts === "yes" && (
          <div className="mt-4 space-y-3">
            {renderEye("Right eye (OD)", odRx, setOdRx)}
            {renderEye("Left eye (OS)", osRx, setOsRx)}
            <p className="text-xs text-slate-500">
              Power (sphere) is on your contact lens box. Cylinder and axis apply
              only to toric lenses for astigmatism. Choose &quot;Not sure&quot; for
              anything you don&apos;t have handy.
            </p>
          </div>
        )}

        <div className="mt-4">
          <span className="text-sm font-medium text-slate-700">
            Have you had cataract surgery?
          </span>
          <select
            name="had_cataract_surgery"
            required
            defaultValue=""
            className={`mt-1 ${inputCls}`}
          >
            <option value="">Please choose...</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-slate-700">
            Do any of these apply to you? (check all that apply)
          </span>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EYE_CONDITIONS.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={conditions.includes(c)}
                  onChange={() => toggleCondition(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Anything else we should know? <span className="text-slate-400">(optional)</span>
          </span>
          <textarea name="notes" rows={2} className={inputCls} />
        </label>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
        <span>
          I agree to be contacted by Eve Research by email or text about research
          studies I may qualify for. I can opt out at any time.
        </span>
      </label>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Submitting..." : "Join the research list"}
      </button>
    </form>
  );
}
