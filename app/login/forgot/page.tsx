import Link from "next/link";
import { resetPassword } from "../actions";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="mx-auto h-28 w-28 rounded-2xl object-contain"
        />
        <h1 className="mt-4 font-serif text-2xl font-bold text-brand-dark">
          Reset password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we will send you a reset link.
        </p>
      </div>

      <form action={resetPassword} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Send reset link
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        <Link href="/login" className="hover:underline">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
