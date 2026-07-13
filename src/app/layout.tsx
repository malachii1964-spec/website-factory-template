import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocalBusinessJsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Plants, Trees & Hydroponics in Lakewood, NY`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "plant nursery Lakewood NY",
    "hydroponics Chautauqua County",
    "garden center Jamestown NY",
    "grow lights",
    "vegetable plants",
    "trees and shrubs",
  ],
  openGraph: {
    type: "website",
    title: `${site.name} · Plants, Trees & Hydroponics`,
    description: site.description,
    url: site.url,
    siteName: site.legalName,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description },
  alternates: { canonical: site.url },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#163a22",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper">
        {/* No-JS safety: scroll-reveal sections must never stay hidden. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only rounded-full focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-canopy focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}
