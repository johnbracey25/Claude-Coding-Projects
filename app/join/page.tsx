import { Suspense } from "react";
import type { Metadata } from "next";
import JoinForm from "@/components/JoinForm";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Join the Eve Research study list",
  description:
    "Sign up to be considered for local eye-research studies with Eve Research. It only takes a minute.",
};

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[#f6f4ee] text-slate-700">
      <PublicHeader />

      <main className="mx-auto max-w-xl px-5">
        <section className="pt-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-dark">
            Join the research list
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-brand-dark">
            Take part in local eye-research studies
          </h1>
          <p className="mt-3 text-slate-600">
            Add your name below. When a study comes up that fits you, we&apos;ll
            reach out. No obligation.
          </p>
        </section>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
            <JoinForm />
          </Suspense>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
