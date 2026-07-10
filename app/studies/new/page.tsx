import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import StudyForm from "@/components/StudyForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewStudyPage() {
  let feeds: { id: string; name: string; color: string }[] = [];
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data } = await supabase
      .from("calendar_feeds")
      .select("id, name, color")
      .eq("enabled", true)
      .order("created_at");
    feeds = data ?? [];
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">New study</h1>
          <Link href="/studies" className="text-sm text-brand-dark hover:underline">
            Back to studies
          </Link>
        </div>
        {isSupabaseConfigured ? (
          <StudyForm calendarFeeds={feeds} />
        ) : (
          <div className="mt-6">
            <SetupNotice />
          </div>
        )}
      </main>
    </>
  );
}
