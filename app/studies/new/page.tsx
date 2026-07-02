import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import StudyForm from "@/components/StudyForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";

export default function NewStudyPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">New study</h1>
          <Link href="/studies" className="text-sm text-brand-dark hover:underline">
            ← Back to studies
          </Link>
        </div>
        {isSupabaseConfigured ? (
          <StudyForm />
        ) : (
          <div className="mt-6">
            <SetupNotice />
          </div>
        )}
      </main>
    </>
  );
}
