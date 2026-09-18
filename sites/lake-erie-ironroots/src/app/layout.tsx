import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { Colophon } from "@/components/site-footer";
import { Masthead } from "@/components/site-header";
import { FARM } from "@/lib/farm";
import "./globals.css";

/*
  Two families, self-hosted by next/font.

  Newsreader is an old-style reading serif with optical sizing — authority from
  the letterforms rather than from weight or stroke contrast. It is deliberately
  not Playfair, Cormorant or Bodoni: high-contrast display serifs are the face a
  model reaches for when no direction has been chosen, and one of them was on the
  build this replaced.

  Plex Mono carries every date, quantity and column in the record. The numbers
  are the content here, so they get their own voice and they align.
*/
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lakeerieironroots.com"),
  title: {
    default: `${FARM.name} — Organic growing, ${FARM.county} NY`,
    template: `%s — ${FARM.name}`,
  },
  description:
    "An organic farm in Westfield, Chautauqua County, New York. Living soil indoors and outdoors, all year round. Read the record of what is growing.",
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
      className={`${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="fig sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-paper focus:px-4 focus:py-3 focus:outline focus:outline-2 focus:outline-ink"
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
