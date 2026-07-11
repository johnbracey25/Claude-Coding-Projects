import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import PeopleBrowser from "@/components/PeopleBrowser";
import { isSupabaseConfigured } from "@/lib/config";
import { listPeopleWithStudies, type PersonWithStudies } from "@/lib/people";
import { listStudies } from "@/lib/studies";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const search = searchParams.q ?? "";

  let people: PersonWithStudies[] = [];
  let studies: { id: string; name: string }[] = [];
  let loadError: string | null = null;
  if (isSupabaseConfigured) {
    try {
      people = await listPeopleWithStudies({ search });
      studies = (await listStudies()).map((s) => ({ id: s.id, name: s.name }));
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Failed to load people.";
    }
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">People</h1>
          <div className="flex gap-2">
            <Link
              href="/people/archived"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Archived
            </Link>
            <Link
              href="/people/import"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Import CSV
            </Link>
            <Link
              href="/people/new"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Add person
            </Link>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <div className="mt-6">
            <SetupNotice />
          </div>
        ) : (
          <>
            <form className="mt-6" action="/people" method="get">
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search name, email, or phone..."
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </form>

            {loadError ? (
              <div className="mt-6">
                <SetupNotice detail={loadError} />
              </div>
            ) : people.length === 0 ? (
              <p className="mt-8 text-slate-500">
                {search
                  ? "No people match your search."
                  : "No people yet. Import your contact CSV to get started."}
              </p>
            ) : (
              <PeopleBrowser people={people} studies={studies} />
            )}
          </>
        )}
      </main>
    </>
  );
}
