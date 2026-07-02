import AdminNav from "@/components/AdminNav";

export default function ComingSoon({
  title,
  phase,
  desc,
}: {
  title: string;
  phase: string;
  desc: string;
}) {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {phase}
          </span>
          <p className="mt-3 text-slate-600">{desc}</p>
        </div>
      </main>
    </>
  );
}
