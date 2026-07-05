import { notFound } from "next/navigation";
import BookingFlow from "@/components/BookingFlow";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { Study } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: { token: string };
}) {
  if (!isSupabaseConfigured) notFound();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("candidates")
    .select("token, study:studies(*)")
    .eq("token", params.token)
    .maybeSingle();
  if (!data?.study) notFound();

  const study = data.study as unknown as Study;
  const visits = (study.visit_plan?.visits ?? []).map((v, i) => ({
    index: i,
    name: v.name,
    duration_min: v.duration_min,
  }));

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="mx-auto h-24 w-24 rounded-2xl object-contain shadow-sm ring-1 ring-black/5"
          />
          <h1 className="mt-3 font-serif text-2xl font-bold text-brand-dark">
            {study.name}
          </h1>
          {study.location && (
            <p className="mt-1 text-sm text-slate-500">{study.location}</p>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <BookingFlow
            token={data.token as string}
            visits={visits}
            studyName={study.name}
            location={study.location}
          />
        </div>
      </main>
    </div>
  );
}
