import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/people", label: "People" },
  { href: "/studies", label: "Studies" },
  { href: "/candidates", label: "Candidates" },
  { href: "/calendar", label: "Calendar" },
];

export default function AdminNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4">
        <Link href="/dashboard" className="mr-4 py-3 font-semibold text-brand-dark">
          Eve Research
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
      </nav>
    </header>
  );
}
