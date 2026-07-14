import AdminNav from "@/components/AdminNav";

const SITE = "https://eve-research.com";

interface Asset {
  file: string;
  title: string;
  points: string;
  code?: string;
  svg?: string;
  tall?: boolean;
  note?: string;
}

const QR_CODES: Asset[] = [
  {
    file: "eve-research-join-qr.png",
    svg: "eve-research-join-qr.svg",
    title: "Join QR",
    points: "/join (signup form)",
    code: "qr",
  },
  {
    file: "eve-research-join-qr-flyer.png",
    svg: "eve-research-join-qr-flyer.svg",
    title: "Join QR — Flyer",
    points: "/join (signup form)",
    code: "qr-flyer",
  },
  {
    file: "eve-research-join-qr-office.png",
    svg: "eve-research-join-qr-office.svg",
    title: "Join QR — Office",
    points: "/join (signup form)",
    code: "qr-office",
  },
  {
    file: "eve-research-home-qr.png",
    svg: "eve-research-home-qr.svg",
    title: "Homepage QR",
    points: "Homepage",
    code: "qr",
    note: "Homepage visits only — a signup's source isn't captured unless they reach /join.",
  },
  {
    file: "eve-research-home-qr-logo.png",
    title: "Homepage QR — with logo",
    points: "Homepage",
    code: "qr",
  },
];

const PRINT: Asset[] = [
  {
    file: "eve-research-card.png",
    title: "Branded card",
    points: "Homepage",
    code: "qr",
    tall: true,
  },
  {
    file: "eve-research-business-card-vertical.png",
    title: "Business card (vertical)",
    points: "/join (signup form)",
    code: "card",
    tall: true,
  },
  {
    file: "eve-research-business-card-vertical-bleed.png",
    title: "Business card — print/bleed",
    points: "/join (signup form)",
    code: "card",
    tall: true,
    note: "Upload this one to VistaPrint: 2.25×3.75in with 0.125in bleed.",
  },
];

function AssetCard({ a }: { a: Asset }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-center rounded-lg bg-slate-50 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/marketing/${a.file}`}
          alt={a.title}
          className={a.tall ? "max-h-72 w-auto" : "h-40 w-40 object-contain"}
        />
      </div>
      <p className="mt-3 font-semibold text-slate-800">{a.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Points to: <span className="text-slate-700">{a.points}</span>
      </p>
      {a.code && (
        <p className="mt-1 text-xs text-slate-500">
          Tracking source:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
            {a.code}
          </code>
        </p>
      )}
      {a.note && <p className="mt-1 text-xs text-amber-600">{a.note}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`/marketing/${a.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Open
        </a>
        <a
          href={`/marketing/${a.file}`}
          download
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
        >
          Download PNG
        </a>
        {a.svg && (
          <a
            href={`/marketing/${a.svg}`}
            download
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Download SVG
          </a>
        )}
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          QR codes and print pieces for recruiting participants. Download and use
          them anywhere — the PNGs are for screens and quick printing, the SVGs
          stay crisp at any size for large-format print.
        </p>

        <div className="mt-4 rounded-xl border border-sage/30 bg-sage/10 p-4 text-sm text-slate-700">
          <p className="font-semibold text-brand-dark">How tracking works</p>
          <p className="mt-1">
            Each code carries a tracking tag. When someone scans it and signs up,
            that tag is saved as their <strong>source</strong>. Open{" "}
            <span className="font-medium">People → Filters → Source includes</span>{" "}
            and type a code (e.g. <code className="rounded bg-white px-1">qr</code>{" "}
            for all QR signups, or{" "}
            <code className="rounded bg-white px-1">qr-flyer</code> for just that
            placement) to see how each piece is performing.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            QR codes
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {QR_CODES.map((a) => (
              <AssetCard key={a.file} a={a} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Print pieces
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINT.map((a) => (
              <AssetCard key={a.file} a={a} />
            ))}
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-400">
          Need a new placement code or a different design? These live in the
          project at <code>public/marketing/</code>. Public URLs look like{" "}
          <code>{SITE}/marketing/eve-research-join-qr.png</code>.
        </p>
      </main>
    </>
  );
}
