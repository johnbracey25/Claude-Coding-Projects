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

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export default function JoinForm() {
  const params = useSearchParams();
  const source = params.get("src") ?? params.get("source") ?? undefined;

  const [conditions, setConditions] = useState<string[]>([]);
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
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload = {
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      date_of_birth: String(fd.get("date_of_birth") ?? ""),
      wears_contacts: fd.get("wears_contacts") === "on",
      had_cataract_surgery: String(fd.get("had_cataract_surgery") ?? "") as
        | "yes"
        | "no"
        | "unsure"
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

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-8 text-center">
        <h2 className="text-xl font-bold text-emerald-800">You&apos;re on the list! 🎉</h2>
        <p className="mt-2 text-emerald-700">
          Thanks for your interest in Eve Research. We&apos;ll reach out by email or
          text when there&apos;s a study you may be a good fit for.
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
          <input name="first_name" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Last name
          </span>
          <input name="last_name" required className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input name="email" type="email" inputMode="email" className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Mobile phone
        </span>
        <input name="phone" type="tel" inputMode="tel" className={inputCls} />
      </label>
      <p className="-mt-3 text-xs text-slate-500">
        Give us an email, a phone, or both — we just need one way to reach you.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Date of birth <span className="text-slate-400">(optional)</span>
        </span>
        <input name="date_of_birth" type="date" className={inputCls} />
        <span className="mt-1 block text-xs text-slate-500">
          Helps us match you to studies with age requirements.
        </span>
      </label>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-600">
          A few quick eye questions (optional)
        </legend>

        <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="wears_contacts" className="h-4 w-4" />
          I currently wear contact lenses
        </label>

        <div className="mt-4">
          <span className="text-sm font-medium text-slate-700">
            Have you had cataract surgery?
          </span>
          <select name="had_cataract_surgery" className={`mt-1 ${inputCls}`}>
            <option value="">Prefer not to say</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
            <option value="unsure">Not sure</option>
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
        {busy ? "Submitting…" : "Join the research list"}
      </button>
    </form>
  );
}
