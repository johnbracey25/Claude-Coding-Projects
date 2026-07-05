import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Eve Research & Dr. Lauren Hacker, O.D.",
  description:
    "Meet Dr. Lauren Hacker, O.D., founder of Eve Research in Athens, Georgia, and learn how our eye and vision studies work.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/eve-research-logo.png"
          alt="Eve Research"
          className="mx-auto h-32 w-32 rounded-2xl object-contain"
        />
      </div>

      <section className="mt-8">
        <h1 className="text-2xl font-bold text-brand-dark">
          Dr. Lauren Hacker, O.D.
        </h1>
        <p className="mt-1 text-sm font-medium text-sage-dark">
          Doctor of Optometry · Founder of Eve Research · Athens, Georgia
        </p>

        <p className="mt-4 leading-relaxed text-slate-700">
          Dr. Lauren Hacker is a Doctor of Optometry and the founder of Eve
          Research in Athens, Georgia. She has cared for patients of all ages for
          more than 15 years, and has spent much of her career at the leading
          edge of vision research.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          She earned her Doctor of Optometry degree from Nova Southeastern
          University College of Optometry and completed a residency at the Dorn
          Veterans Affairs Medical Center, focusing on ocular disease, low vision,
          and specialty contact lens fittings. In private practice she provided
          comprehensive eye care along with post-operative care using the latest
          cataract and LASIK technologies. She is an active member of the American
          Optometric Association and the Georgia Optometric Association, and holds
          an active Georgia license and injections certification.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-brand-dark">
          Research that reaches everyday life
        </h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Over the past decade, Dr. Hacker has helped run clinical studies for
          leading eye-care companies, including Johnson &amp; Johnson and Alcon,
          testing new contact lenses and lens implants.
        </p>
        <p className="mt-3 leading-relaxed text-slate-700">
          One project she is especially proud of tested contact lenses that
          automatically darken in bright light. Working alongside vision
          scientists at the University of Georgia, the team measured how these
          light-adapting lenses helped people see more comfortably and clearly in
          intense glare, like bright sunlight. Research like this is how the
          everyday products that make vision easier get proven safe and effective
          before they ever reach you.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-brand-dark">
          About Eve Research
        </h2>
        <p className="mt-3 leading-relaxed text-slate-700">
          Eve Research, short for Emerging Vision Exploration, was founded by
          Dr. Hacker in 2021. Its mission is simple: connect people in the
          community with local eye and vision studies, and make taking part easy.
        </p>
        <ul className="mt-3 space-y-2 text-slate-700">
          <li className="flex gap-2">
            <span className="text-sage-dark">•</span>
            We match you to studies you may qualify for, based on what you tell us.
          </li>
          <li className="flex gap-2">
            <span className="text-sage-dark">•</span>
            We invite you to take part with no obligation, and you can opt out
            anytime.
          </li>
          <li className="flex gap-2">
            <span className="text-sage-dark">•</span>
            Signing up takes a minute. When a study fits you, we reach out and you
            pick a time that works.
          </li>
        </ul>
      </section>

      <section className="mt-8 rounded-xl bg-slate-50 p-4">
        <p className="leading-relaxed text-slate-700">
          Dr. Hacker has called Athens, Georgia home for 20 years. She is married
          to John Bracey and mom to their daughter, Ivey Jane.
        </p>
      </section>

      <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 text-center">
        <p className="text-slate-700">Interested in taking part in a study?</p>
        <Link
          href="/join"
          className="mt-3 inline-block rounded-lg bg-brand px-6 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          Join the research list
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        Eve Research · Athens, Georgia · Your information is kept private and used
        only to contact you about research opportunities.
      </p>
    </main>
  );
}
