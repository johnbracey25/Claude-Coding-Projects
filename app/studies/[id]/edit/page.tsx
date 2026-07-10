import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import StudyForm from "@/components/StudyForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getStudy } from "@/lib/studies";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditStudyPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured) {
    return (
      <>
        <AdminNav />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <SetupNotice />
        </main>
      </>
    );
  }

  const study = await getStudy(params.id);
  if (!study) notFound();

  const supabase = createClient();
  const { data } = await supabase
    .from("calendar_feeds")
    .select("id, name, color")
    .eq("enabled", true)
    .order("created_at");
  const feeds = data ?? [];

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Edit study</h1>
          <Link href={`/studies/${study.id}`} className="text-sm text-brand-dark hover:underline">
            Back
          </Link>
        </div>
        <StudyForm study={study} calendarFeeds={feeds} />
      </main>
    </>
  );
}
