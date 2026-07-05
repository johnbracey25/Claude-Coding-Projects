import { Suspense } from "react";
import type { Metadata } from "next";
import JoinForm from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "Join the Eve Research study list",
  description:
    "Sign up to be considered for paid eye-research studies with Eve Research. It only takes a minute.",
};

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="mx-auto h-40 w-40 rounded-2xl object-contain"
        />
        <p className="mt-4 text-lg text-slate-700">
          Interested in taking part in local eye-research studies?
        </p>
        <p className="mt-1 text-slate-500">
          Add your name to our list. When a study comes up that fits you, we&apos;ll
          reach out. No obligation.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
          <JoinForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Your information is kept private and used only to contact you about
        research opportunities with Eve Research.
      </p>
    </main>
  );
}
