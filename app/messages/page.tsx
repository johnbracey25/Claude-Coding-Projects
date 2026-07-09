import AdminNav from "@/components/AdminNav";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured, isEmailConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

interface MsgRow extends Message {
  person: { first_name: string; last_name: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  skipped: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
};

export default async function MessagesPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <AdminNav />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <SetupNotice />
        </main>
      </>
    );
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, person:people(first_name,last_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const messages = (data ?? []) as unknown as MsgRow[];

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-slate-600">
          Every email and text the app has tried to send, with its result.
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 ${
              isEmailConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            Email: {isEmailConfigured ? "configured" : "not configured"}
          </span>
        </div>

        {messages.length === 0 ? (
          <p className="mt-8 text-slate-500">No messages yet.</p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {messages.map((m) => (
                  <tr key={m.id} className="align-top hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      {m.person
                        ? `${m.person.first_name} ${m.person.last_name}`.trim()
                        : m.direction === "inbound"
                          ? "(inbound)"
                          : "-"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {m.channel}
                      {m.direction === "inbound" ? " (in)" : ""}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          STATUS_STYLE[m.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {m.error ? (
                        <span className="text-rose-600">{m.error}</span>
                      ) : (
                        <span className="line-clamp-2">{m.body}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
