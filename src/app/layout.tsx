import type { Metadata } from "next";
import { Fraunces, Albert_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AgeGate } from "@/components/age-gate";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["WONK", "opsz"],
});

const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  "https://lakeeriecannabis.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Lake Erie Cannabis — Grow Frosty Buds the Easy Way",
    template: "%s · Lake Erie Cannabis",
  },
  description:
    "Premium grower-first cannabis knowledge for indoor and outdoor home growers. Simple, stage-by-stage guides from seed to cure, plant diagnosis, strains, and trusted gear — rooted in Western New York.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icon-180.png",
  },
  openGraph: {
    siteName: "Lake Erie Cannabis",
    title: "Lake Erie Cannabis — Grow Frosty Buds the Easy Way",
    description:
      "Premium grower-first cannabis knowledge for indoor and outdoor home growers — rooted in Western New York.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.webp", width: 1200, height: 675, alt: "Lake Erie Cannabis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lake Erie Cannabis — Grow Frosty Buds the Easy Way",
    images: [{ url: "/og-image.webp", alt: "Lake Erie Cannabis" }],
  },
  alternates: {
    canonical: SITE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${albert.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-void"
        >
          Skip to content
        </a>
        <AgeGate />
        <div id="main-content" />
        {children}
        {/* Analytics load after interactive and are excluded from the LCP path.
            Both are no-ops off Vercel, so local dev stays clean. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
