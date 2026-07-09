"use client";

import { useState, useEffect } from "react";
import AdminNav from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/client";

type MfaStatus = "loading" | "not_enrolled" | "enrolling" | "enrolled";

export default function MfaSettingsPage() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkEnrollment();
  }, []);

  async function checkEnrollment() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.filter((f) => f.status === "verified") ?? [];
    setStatus(verified.length > 0 ? "enrolled" : "not_enrolled");
  }

  async function startEnrollment() {
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Eve Research",
    });
    if (err || !data) {
      setError(err?.message || "Could not start enrollment.");
      return;
    }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setStatus("enrolling");
  }

  async function verifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const supabase = createClient();
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (chErr || !challenge) {
      setError(chErr?.message || "Challenge failed.");
      setVerifying(false);
      return;
    }

    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (vErr) {
      setError("Invalid code. Make sure you entered the code from your authenticator app.");
      setVerifying(false);
      return;
    }

    setStatus("enrolled");
    setQrCode("");
    setSecret("");
    setCode("");
    setVerifying(false);
  }

  async function unenroll() {
    setError("");
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const factors = data?.totp ?? [];
    for (const f of factors) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    setStatus("not_enrolled");
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Two-factor authentication
        </h1>
        <p className="mt-1 text-slate-600">
          Protect your account with an authenticator app like Google
          Authenticator.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {status === "loading" && (
          <p className="mt-8 text-slate-500">Checking status...</p>
        )}

        {status === "not_enrolled" && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">
              Two-factor authentication is not set up yet. You will need
              Google Authenticator (or a similar app) on your phone.
            </p>
            <button
              onClick={startEnrollment}
              className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Set up 2FA
            </button>
          </div>
        )}

        {status === "enrolling" && (
          <div className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Step 1: Scan this QR code with your authenticator app
              </p>
              {qrCode && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrCode}
                  alt="Scan this QR code"
                  className="mt-3 h-48 w-48 rounded-lg border border-slate-200"
                />
              )}
              {secret && (
                <p className="mt-2 text-xs text-slate-500">
                  Or enter this key manually:{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                    {secret}
                  </code>
                </p>
              )}
            </div>

            <form onSubmit={verifyEnrollment}>
              <p className="text-sm font-semibold text-slate-700">
                Step 2: Enter the 6-digit code from the app
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-3 w-40 rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-[0.3em] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                autoFocus
              />
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={code.length !== 6 || verifying}
                  className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {verifying ? "Verifying..." : "Confirm setup"}
                </button>
              </div>
            </form>
          </div>
        )}

        {status === "enrolled" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="font-semibold text-emerald-800">
              2FA is active
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              You will be asked for a code from your authenticator app each
              time you sign in.
            </p>
            <button
              onClick={unenroll}
              className="mt-4 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Remove 2FA
            </button>
          </div>
        )}
      </main>
    </>
  );
}
