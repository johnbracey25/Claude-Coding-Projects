import Link from "next/link";
import type { Metadata } from "next";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Eve Research | Eye & Vision Studies in Athens, GA",
  alternates: { canonical: "https://eve-research.com" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Eve Research",
  alternateName: "Emerging Vision Exploration",
  description:
    "Eve Research connects people in the Athens, Georgia community with local eye and vision research studies.",
  url: "https://eve-research.com",
  logo: "https://eve-research.com/eve-research-logo.png",
  image: "https://eve-research.com/eve-research-logo.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Athens",
    addressRegion: "GA",
    addressCountry: "US",
  },
  founder: {
    "@type": "Person",
    name: "Dr. Lauren Hacker",
    jobTitle: "Doctor of Optometry",
    description:
      "Optometrist with 15+ years of experience specializing in eye and vision clinical research.",
  },
  medicalSpecialty: "Optometry",
  areaServed: {
    "@type": "City",
    name: "Athens",
    containedInPlace: { "@type": "State", name: "Georgia" },
  },
};

const BADGES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Safe & Ethical",
    text: "All studies are overseen by independent review boards.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: "Local & Trusted",
    text: "Proudly based in Athens, GA and physician owned.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Paid Studies",
    text: "All studies are paid if you qualify.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Making an Impact",
    text: "Help shape the future of eye care.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4ee] text-slate-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-16 sm:pt-24">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
          {/* Left column */}
          <div className="flex-1 text-center md:flex-[4] md:text-left">
            <div className="mb-8 flex items-center gap-4 justify-center md:justify-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eve-icon.png" alt="" className="h-14 w-14 object-contain" />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-4xl font-bold tracking-tight text-brand-dark">Eve</span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-sage-dark">Research</span>
              </div>
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-brand-dark sm:text-5xl lg:text-6xl">
              Better vision{" "}
              <br className="hidden sm:inline" />
              for <span className="text-sage">tomorrow</span>
            </h1>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-sage md:mx-0" />
            <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600 md:mx-0 mx-auto">
              Eve Research conducts clinical studies advancing new eye care
              treatments. All studies are paid if you qualify.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:justify-start justify-center">
              <Link
                href="/join"
                className="rounded-full bg-sage px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-sage-dark"
              >
                Join a Study
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold uppercase tracking-wider text-slate-600 transition hover:border-brand hover:text-brand-dark"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right column -- logo icon */}
          <div className="flex flex-1 items-center justify-center md:flex-[8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/eve-icon.png"
              alt="Eve Research eye logo"
              className="w-[31rem] max-w-full object-contain sm:w-[36rem] md:w-full"
            />
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-t border-slate-200/60 bg-white/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 sm:gap-8">
          {BADGES.map((b) => (
            <div key={b.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage/15 text-sage-dark">
                {b.icon}
              </div>
              <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-brand-dark">
                {b.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Staff link */}
      <div className="py-6 text-center">
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 transition hover:text-brand-dark"
        >
          Staff sign in
        </Link>
      </div>

      <PublicFooter />
    </div>
  );
}
