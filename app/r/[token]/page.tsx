import { notFound } from "next/navigation";
import ResponseButtons from "@/components/ResponseButtons";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import type { Study } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RespondPage({
  params,
}: {
  params: { token: string };
}) {
  if (!isSupabaseConfigured) notFound();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("candidates")
    .select("id, token, study:studies(*)")
    .eq("token", params.token)
    .maybeSingle();

  if (!data) notFound();
  const study = data.study as unknown as Study;

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            width={72}
            height={72}
            className="mx-auto rounded-2xl shadow-sm"
          />
          <h1 className="mt-3 font-serif text-2xl font-bold text-brand-dark">
            Eve Research
          </h1>
          <p className="mt-1 text-slate-600">You may qualify for a study</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">{study.name}</h2>
          {study.description && (
            <p className="mt-2 text-slate-700">{study.description}</p>
          )}
          {(study.location || study.compensation) && (
            <dl className="mt-4 space-y-1 text-sm text-slate-600">
              {study.location && (
                <div>
                  <span className="font-medium text-slate-500">Location: </span>
                  {study.location}
                </div>
              )}
              {study.compensation && (
                <div>
                  <span className="font-medium text-slate-500">
                    Compensation:{" "}
                  </span>
                  {study.compensation}
                </div>
              )}
            </dl>
          )}

          <p className="mt-5 text-sm text-slate-500">
            Interested in taking part? Let us know below and share your general
            availability — we&apos;ll give you a call to set up a time. There&apos;s
            no obligation.
          </p>
          <div className="mt-4">
            <ResponseButtons token={data.token as string} />
          </div>
        </div>
      </main>
    </div>
  );
}
