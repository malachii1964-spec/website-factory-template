import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/toaster";
import { publicEnv } from "@/lib/env";
import { body, display } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: "GANJALOKA — the 21+ world of cannabis culture", template: "%s · GANJALOKA" },
  description:
    "GANJALOKA is the 21+ social world for cannabis culture: share your grow, talk strains and sessions, and follow the people who know the plant. No buying or selling.",
  applicationName: "GANJALOKA",
  openGraph: { siteName: "GANJALOKA", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#110e14",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
