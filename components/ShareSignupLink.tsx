"use client";

import { useEffect, useState } from "react";

const CAMPAIGNS = [
  { label: "Plain link", src: "" },
  { label: "Nextdoor", src: "nextdoor" },
  { label: "Facebook", src: "facebook" },
  { label: "Flyer", src: "flyer" },
  { label: "Referral", src: "referral" },
];

/**
 * Lets staff copy the public /join signup link, optionally tagged with a
 * source (?src=nextdoor) so signups can be attributed to where they were
 * posted. Built client-side from the current origin.
 */
export default function ShareSignupLink() {
  const [origin, setOrigin] = useState("");
  const [src, setSrc] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/join${src ? `?src=${src}` : ""}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Share your signup link</h2>
      <p className="mt-1 text-sm text-slate-600">
        Post this anywhere: Nextdoor, Facebook, flyers. People who sign up land
        in your People list automatically.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {CAMPAIGNS.map((c) => (
          <button
            key={c.label}
            onClick={() => setSrc(c.src)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              src === c.src
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
        />
        <button
          onClick={copy}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
