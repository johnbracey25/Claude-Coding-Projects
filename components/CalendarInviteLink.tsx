"use client";

import { useState } from "react";
import { generateInviteLink } from "@/app/calendar/actions";

export default function CalendarInviteLink({
  initialCode,
  baseUrl,
}: {
  initialCode: string | null;
  baseUrl: string;
}) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const link = code ? `${baseUrl}/connect-calendar?code=${code}` : null;

  async function generate() {
    setBusy(true);
    const newCode = await generateInviteLink();
    setCode(newCode);
    setBusy(false);
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-600">
        Invite someone to connect their calendar
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Send this link to a calendar owner. They will see step-by-step
        instructions and can paste their calendar URL.
      </p>

      {link ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
          <button
            onClick={copy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={generate}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            New link
          </button>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={busy}
          className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Generating..." : "Generate invite link"}
        </button>
      )}
    </div>
  );
}
