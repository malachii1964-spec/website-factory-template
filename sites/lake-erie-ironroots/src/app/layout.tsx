import type { Metadata } from "next";
import { Cinzel, Spectral } from "next/font/google";
import { Colophon } from "@/components/site-footer";
import { Masthead } from "@/components/site-header";
import { FARM } from "@/lib/farm";
import "./globals.css";

/*
  Two families, self-hosted by next/font.

  Cinzel is an inscribed Roman capital, which is what the plate's wordmark is.
  Headings and small tracked labels are set in it so the logo reads as part of
  the page rather than pasted onto it. Spectral carries the reading text — a
  serif with enough weight to hold its own on a near-black ground, where a
  lighter face would disappear.
*/
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lakeerieironroots.com"),
  title: {
    default: `${FARM.name} — ${FARM.tagline}`,
    template: `%s — ${FARM.name}`,
  },
  description:
    "An organic farm in Westfield, Chautauqua County, New York. Living soil indoors and outdoors, all year round. Read the register of what is growing.",
  openGraph: {
    type: "website",
    siteName: FARM.name,
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${spectral.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-void">
        <a
          href="#main"
          className="cut sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-rock focus:px-4 focus:py-3 focus:text-gild"
        >
          Skip to content
        </a>
        <Masthead />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Colophon />
      </body>
    </html>
  );
}
