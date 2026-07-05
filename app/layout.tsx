import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Eve Research | Eye & Vision Studies in Athens, GA",
    template: "%s | Eve Research",
  },
  description:
    "Eve Research connects people in the Athens, Georgia community with local eye and vision research studies led by Dr. Lauren Hacker, O.D. Sign up in a minute.",
  metadataBase: new URL("https://eve-research.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Eve Research",
    title: "Eve Research | Eye & Vision Studies in Athens, GA",
    description:
      "Join local eye and vision research studies in Athens, Georgia. Led by Dr. Lauren Hacker, O.D. Sign up takes a minute, no obligation.",
    images: [{ url: "/eve-research-logo.png", width: 512, height: 512, alt: "Eve Research logo" }],
  },
  twitter: {
    card: "summary",
    title: "Eve Research | Eye & Vision Studies in Athens, GA",
    description:
      "Join local eye and vision research studies in Athens, Georgia. Led by Dr. Lauren Hacker, O.D.",
    images: ["/eve-research-logo.png"],
  },
  keywords: [
    "eye research study",
    "vision research",
    "Athens GA",
    "Athens Georgia",
    "clinical study",
    "eye study",
    "contact lens study",
    "optometry research",
    "Dr. Lauren Hacker",
    "Eve Research",
    "paid research study Athens",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://eve-research.com" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
