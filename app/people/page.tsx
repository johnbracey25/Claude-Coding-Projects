import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { listPeople } from "@/lib/people";
import type { Person } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const search = searchParams.q ?? "";

  let people: Person[] = [];
  let loadError: string | null = null;
  if (isSupabaseConfigured) {
    try {
      people = await listPeople({ search });
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
                placeholder="Search name, email, or phone…"
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
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Phone</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {people.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <Link
                            href={`/people/${p.id}`}
                            className="font-medium text-brand-dark hover:underline"
                          >
                            {p.last_name || p.first_name
                              ? `${p.last_name}${p.last_name && p.first_name ? ", " : ""}${p.first_name}`
                              : "(no name)"}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{p.email ?? "-"}</td>
                        <td className="px-4 py-2 text-slate-600">{p.phone ?? "-"}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {people.length > 0 && (
              <p className="mt-3 text-xs text-slate-400">
                Showing {people.length} {people.length === 1 ? "person" : "people"}.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: Person["status"] }) {
  const styles: Record<Person["status"], string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    do_not_contact: "bg-rose-100 text-rose-700",
  };
  const label: Record<Person["status"], string> = {
    active: "Active",
    inactive: "Inactive",
    do_not_contact: "Do not contact",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${styles[status]}`}>
      {label[status]}
    </span>
  );
}
