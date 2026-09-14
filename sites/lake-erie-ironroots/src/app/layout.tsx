import type { Metadata } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { RootTrunk } from "@/components/root";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { FARM } from "@/lib/farm";
import "./globals.css";

/*
  Two families, four weights of real range, self-hosted by next/font.
  Bodoni Moda is the engraved plate — heavy stems, razor hairlines, which is
  the beveled metal of the wordmark. Archivo is the industrial counterweight
  and the brand board's own letterspaced caps.
*/
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lakeerieironroots.com"),
  title: {
    default: `${FARM.name} — Organic fruit and vegetables, ${FARM.county} NY`,
    template: `%s — ${FARM.name}`,
  },
  description:
    "An organic fruit and vegetable farm on the Lake Erie plain in Chautauqua County, New York. See what is ready at the stand today.",
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
      className={`${bodoni.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-shale focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/*
          The trunk lives here, once, spanning the whole document — not in each
          page and not pinned to the viewport. Sections grow their own branches
          off it (see components/root.tsx).
        */}
        <main id="main" className="descent relative flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 inset-x-0"
          >
            <div className="relative mx-auto h-full w-full max-w-6xl">
              <RootTrunk />
            </div>
          </div>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
