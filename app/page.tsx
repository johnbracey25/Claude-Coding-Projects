import Link from "next/link";
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4ee] text-slate-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="h-44 w-44 rounded-2xl object-contain drop-shadow-sm"
        />

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-sage-dark">
          Eye &amp; Vision Research · Athens, GA
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
          Focused on Tomorrow&apos;s Vision
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">
          Eve Research connects people in the Athens community with local eye and
          vision studies. Add your name and we&apos;ll reach out when a study fits
          you. No obligation.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/join"
            className="rounded-lg bg-brand px-7 py-3 font-medium text-white transition hover:bg-brand-dark"
          >
            Join a research study
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-slate-300 bg-white px-7 py-3 font-medium text-slate-700 transition hover:border-brand hover:text-brand-dark"
          >
            Meet Dr. Hacker
          </Link>
        </div>

        <Link
          href="/dashboard"
          className="mt-8 text-sm text-slate-400 transition hover:text-brand-dark"
        >
          Staff sign in
        </Link>
      </main>

      <PublicFooter />
    </div>
  );
}
