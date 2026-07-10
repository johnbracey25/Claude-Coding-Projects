import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import ArchivedTable from "@/components/ArchivedTable";
import { listArchivedPeople } from "@/lib/people";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ArchivedPeoplePage() {
  let people: Person[] = [];
  try {
    people = await listArchivedPeople();
  } catch {
    // fall through with empty list
  }

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Archived people
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Deleted records can be recovered here for 30 days.
            </p>
          </div>
          <Link
            href="/people"
            className="text-sm text-brand-dark hover:underline"
          >
            &larr; Back to people
          </Link>
        </div>

        {people.length === 0 ? (
          <p className="mt-8 text-slate-500">No archived records.</p>
        ) : (
          <ArchivedTable people={people} />
        )}
      </main>
    </>
  );
}
