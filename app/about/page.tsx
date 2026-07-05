import Link from "next/link";
import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import EveLogo from "@/components/EveLogo";

export const metadata: Metadata = {
  title: "About Dr. Lauren Hacker, O.D. & Eve Research",
  description:
    "Meet Dr. Lauren Hacker, O.D., optometrist and founder of Eve Research in Athens, Georgia. 15+ years of experience in eye care and clinical vision research with Johnson & Johnson and Alcon.",
  alternates: { canonical: "https://eve-research.com/about" },
};

const CREDENTIALS = [
  "Nova Southeastern O.D.",
  "VA Residency Trained",
  "15+ Years in Practice",
  "Clinical Researcher",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-dark">
      {children}
    </p>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f6f4ee] text-slate-700">
      <PublicHeader />

      <main className="mx-auto max-w-3xl px-5">
        {/* Hero */}
        <section className="pt-12 text-center">
          <EveLogo size="sm" className="mx-auto h-20 w-28" />
          <div className="mt-5">
            <Eyebrow>Meet the founder</Eyebrow>
          </div>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-brand-dark">
            Dr. Lauren Hacker, O.D.
          </h1>
          <p className="mt-2 text-slate-600">
            Doctor of Optometry · Founder of Eve Research · Athens, Georgia
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {CREDENTIALS.map((c) => (
              <span
                key={c}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-dark ring-1 ring-slate-200"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Bio */}
        <section className="mt-10 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-100">
          <p className="leading-relaxed">
            Dr. Lauren Hacker is a Doctor of Optometry and the founder of Eve
            Research in Athens, Georgia. She has cared for patients of all ages for
            more than 15 years, and has spent much of her career at the leading
            edge of vision research.
          </p>
          <p className="mt-4 leading-relaxed">
            She earned her Doctor of Optometry degree from Nova Southeastern
            University College of Optometry and completed a residency at the Dorn
            Veterans Affairs Medical Center, focusing on ocular disease, low
            vision, and specialty contact lens fittings. In private practice she
            provided comprehensive eye care along with post-operative care using
            the latest cataract and LASIK technologies. She is an active member of
            the American Optometric Association and the Georgia Optometric
            Association, and holds an active Georgia license and injections
            certification.
          </p>
        </section>

        {/* Research highlight */}
        <section className="mt-6 overflow-hidden rounded-2xl bg-brand p-7 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            Research that reaches everyday life
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">
            Lenses that adapt to the light around you
          </h2>
          <p className="mt-3 leading-relaxed text-slate-100">
            Over the past decade, Dr. Hacker has helped run clinical studies for
            leading eye-care companies, including Johnson &amp; Johnson and Alcon.
            One project she is especially proud of tested contact lenses that
            automatically darken in bright light. Working alongside vision
            scientists at the University of Georgia, the team measured how these
            light-adapting lenses helped people see more comfortably and clearly in
            intense glare, like bright sunlight. Research like this is how the
            everyday products that make vision easier get proven safe and effective
            before they ever reach you.
          </p>
        </section>

        {/* About Eve Research */}
        <section className="mt-8">
          <Eyebrow>About the practice</Eyebrow>
          <h2 className="mt-2 font-serif text-2xl font-bold text-brand-dark">
            About Eve Research
          </h2>
          <p className="mt-3 leading-relaxed">
            <span className="font-semibold text-brand-dark">
              <span className="text-sage-dark">E</span>ve
            </span>{" "}
            is short for{" "}
            <span className="font-semibold text-brand-dark">
              <span className="text-sage-dark">E</span>merging{" "}
              <span className="text-sage-dark">V</span>ision{" "}
              <span className="text-sage-dark">E</span>xploration
            </span>
            . Founded by Dr. Hacker in 2021, its mission is simple: connect people
            in the community with local eye and vision studies, and make taking
            part easy.
          </p>
          <ul className="mt-4 space-y-3">
            {[
              "We match you to studies you may qualify for, based on what you tell us.",
              "We invite you to take part with no obligation, and you can opt out anytime.",
              "Signing up takes a minute. When a study fits you, we reach out and you pick a time that works.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sage/25 text-xs font-bold text-sage-dark">
                  ✓
                </span>
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Personal */}
        <section className="mt-8 rounded-2xl bg-sage/10 p-6 ring-1 ring-sage/20">
          <p className="leading-relaxed text-slate-700">
            Beyond the clinic, Dr. Hacker has called Athens, Georgia home for 20
            years. She is married to John Bracey and mom to their daughter, Ivey
            Jane.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h3 className="font-serif text-xl font-semibold text-brand-dark">
            Interested in taking part in a study?
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add your name to our list. It only takes a minute.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-block rounded-lg bg-brand px-7 py-3 font-medium text-white transition hover:bg-brand-dark"
          >
            Join the research list
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
