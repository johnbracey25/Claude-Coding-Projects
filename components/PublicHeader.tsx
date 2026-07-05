import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#f6f4ee]/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <span className="font-serif text-lg font-semibold tracking-tight text-brand-dark">
            Eve Research
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/about"
            className="rounded-lg px-3 py-2 text-slate-600 transition hover:text-brand-dark"
          >
            About
          </Link>
          <Link
            href="/join"
            className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
