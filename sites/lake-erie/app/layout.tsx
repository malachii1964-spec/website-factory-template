import type { Metadata } from "next";
import { Archivo, Newsreader } from "next/font/google";
import "./globals.css";

// Archivo does signage and tag fields; Newsreader carries the reading. A serif
// body on a dark ground is not the default reach, which is the point.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const SITE_URL = "https://lakeeriecannabis.com";
const DESCRIPTION =
  "Cannabis genetics bred for the Lake Erie shoreline — Chautauqua County, New York. Clones, seed and cultivation notes for growers in the lake-effect belt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Lake Erie Cannabis — genetics for the lake-effect belt",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Lake Erie Cannabis",
    title: "Lake Erie Cannabis — genetics for the lake-effect belt",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${newsreader.variable}`}>
      <body className="bg-deep text-limestone">{children}</body>
    </html>
  );
}
