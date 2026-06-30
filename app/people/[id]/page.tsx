import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import PersonForm from "@/components/PersonForm";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getPerson } from "@/lib/people";

export const dynamic = "force-dynamic";

export default async function PersonDetailPage({
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

  const person = await getPerson(params.id);
  if (!person) notFound();

  const name =
    `${person.first_name} ${person.last_name}`.trim() || "(no name)";

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          <Link href="/people" className="text-sm text-brand-dark hover:underline">
            ← Back to people
          </Link>
        </div>
        <PersonForm person={person} />
      </main>
    </>
  );
}
