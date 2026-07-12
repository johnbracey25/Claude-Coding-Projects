import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import DeletePersonButton from "@/components/DeletePersonButton";
import { isSupabaseConfigured } from "@/lib/config";
import { getPerson } from "@/lib/people";

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "-";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function brandOf(rx: Record<string, unknown> | null): string {
  const b = rx && typeof rx === "object" ? (rx as { brand?: unknown }).brand : null;
  return typeof b === "string" && b.trim() ? b : "-";
}

function formatRx(rx: Record<string, unknown> | null): string {
  if (!rx) return "-";
  try {
    const parts: string[] = [];
    const od = rx.od as Record<string, string> | null;
    const os = rx.os as Record<string, string> | null;
    if (od?.sphere) parts.push(`OD: ${od.sphere}${od.cylinder ? ` / ${od.cylinder}` : ""}${od.axis ? ` x ${od.axis}` : ""}`);
    if (os?.sphere) parts.push(`OS: ${os.sphere}${os.cylinder ? ` / ${os.cylinder}` : ""}${os.axis ? ` x ${os.axis}` : ""}`);
    if (parts.length) return parts.join("  |  ");
    return JSON.stringify(rx);
  } catch {
    return JSON.stringify(rx);
  }
}

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

  const statusLabel: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    do_not_contact: "Do not contact",
  };
  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    do_not_contact: "bg-rose-100 text-rose-700",
  };

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/people" className="text-sm text-brand-dark hover:underline">
              &larr; Back to people
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[person.status] ?? ""}`}>
                {statusLabel[person.status] ?? person.status}
              </span>
              {person.is_repeat_participant && (
                <span className="rounded-full bg-sage/20 px-2 py-0.5 text-xs font-medium text-sage-dark">
                  Repeat participant
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/people/${person.id}/edit`}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Edit
            </Link>
            <DeletePersonButton id={person.id} name={name} />
          </div>
        </div>

        {/* Contact info */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Contact</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Detail label="Email" value={person.email ?? "-"} />
            <Detail label="Phone" value={person.phone ?? "-"} />
            <Detail label="Date of birth" value={formatDate(person.date_of_birth)} />
            <Detail label="Email opt-in" value={person.email_opt_in ? "Yes" : "No"} />
          </dl>
        </section>

        {/* Eye profile */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Eye profile</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Detail
              label="Cataract surgery"
              value={
                person.had_cataract_surgery === true
                  ? "Yes"
                  : person.had_cataract_surgery === false
                    ? "No"
                    : "Unknown"
              }
            />
            <Detail label="Contact Rx" value={formatRx(person.contact_rx)} />
            <Detail label="Contact lens brand" value={brandOf(person.contact_rx)} />
            <Detail
              label="Eye conditions"
              value={person.eye_conditions?.length ? person.eye_conditions.join(", ") : "None"}
            />
            <Detail
              label="Ocular health issues"
              value={person.ocular_health_issues?.length ? person.ocular_health_issues.join(", ") : "None"}
            />
          </dl>
        </section>

        {/* Other info */}
        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Other</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Detail label="Source" value={person.source ?? "-"} />
            <Detail label="Tags" value={person.tags?.length ? person.tags.join(", ") : "-"} />
            <Detail label="Signed up" value={person.signed_up_at ? formatDate(person.signed_up_at) : "-"} />
            <Detail label="Added" value={formatDate(person.created_at?.split("T")[0] ?? null)} />
          </dl>
          {person.notes && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <dt className="text-xs font-medium text-slate-500">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{person.notes}</dd>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
