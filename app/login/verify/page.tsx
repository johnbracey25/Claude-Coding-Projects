"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];

    if (!totp) {
      setError("No authenticator found. Please contact an administrator.");
      setLoading(false);
      return;
    }

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId: totp.id });

    if (challengeErr || !challenge) {
      setError(challengeErr?.message || "Could not start verification.");
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyErr) {
      setError("Invalid code. Please try again.");
      setLoading(false);
      return;
    }

    router.push(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        autoFocus
      />
      <button
        type="submit"
        disabled={code.length !== 6 || loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="mx-auto h-28 w-28 rounded-2xl object-contain"
        />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Two-factor authentication
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>
      <Suspense>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
