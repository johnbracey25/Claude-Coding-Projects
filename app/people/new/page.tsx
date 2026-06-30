import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import PersonForm from "@/components/PersonForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";

export default function NewPersonPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Add person</h1>
          <Link href="/people" className="text-sm text-brand-dark hover:underline">
            ← Back to people
          </Link>
        </div>
        {isSupabaseConfigured ? (
          <PersonForm />
        ) : (
          <div className="mt-6">
            <SetupNotice />
          </div>
        )}
      </main>
    </>
  );
}
