import Link from "next/link";
import { signOut } from "@/app/login/actions";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/people", label: "People" },
  { href: "/studies", label: "Studies" },
  { href: "/candidates", label: "Candidates" },
  { href: "/calendar", label: "Calendar" },
  { href: "/messages", label: "Messages" },
  { href: "/settings/mfa", label: "Settings" },
];

export default function AdminNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4">
        <Link
          href="/dashboard"
          className="mr-3 flex items-center gap-2 py-2 font-semibold text-brand-dark"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="h-8 w-8 rounded object-contain"
          />
          <span className="hidden sm:inline">Eve Research</span>
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            className="rounded px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            Home ↗
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
