import Link from "next/link";
import { signIn } from "./actions";
import { isSupabaseConfigured } from "@/lib/config";
import SetupNotice from "@/components/SetupNotice";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="h-28 w-28 rounded-2xl object-contain"
        />
        <p className="mt-2 text-sm text-slate-500">Staff sign in</p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : (
        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/dashboard"} />
          {searchParams.error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
              {searchParams.error}
            </div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Password</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Sign in
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
