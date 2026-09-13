import type { Metadata } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
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
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
