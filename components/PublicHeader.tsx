import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-[#f6f4ee]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/eve-research-logo.png"
            alt="Eve Research"
            className="h-12 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href="/about"
            className="rounded-lg px-3 py-2 font-medium uppercase tracking-wider text-slate-500 transition hover:text-brand-dark"
          >
            About
          </Link>
          <Link
            href="/join"
            className="rounded-full bg-sage px-5 py-2 font-semibold uppercase tracking-wider text-white transition hover:bg-sage-dark"
          >
            Join a Study
          </Link>
        </nav>
      </div>
    </header>
  );
}
