export default function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Database not connected yet</p>
      <p className="mt-1">
        Add your Supabase URL and keys to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> (copy from{" "}
        <code className="rounded bg-amber-100 px-1">.env.example</code>) and run
        the migration in{" "}
        <code className="rounded bg-amber-100 px-1">supabase/migrations/</code>{" "}
        to enable this page.
      </p>
      {detail && <p className="mt-2 text-amber-600">{detail}</p>}
    </div>
  );
}
