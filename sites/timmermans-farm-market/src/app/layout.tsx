import type { Metadata } from "next";
import { fraunces, workSans, caveat } from "@/lib/fonts";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { LocalBusinessJsonLd } from "@/components/site/local-business-jsonld";
import { business, hoursDisplay, seasonDisplay } from "@/lib/business";
import "./globals.css";

const shortDescription = `Family-run fruit stand on Route 20 in Westfield, NY. Open ${hoursDisplay}, ${seasonDisplay}.`;

export const metadata: Metadata = {
  title: {
    default: `${business.name} | Westfield, NY`,
    template: `%s | ${business.name}`,
  },
  description: `A family-run fruit stand on Route 20 in Westfield, NY. ${shortDescription} Fresh peaches, sweet corn, apples, and more.`,
  metadataBase: new URL("https://www.timmermansfarmandmarket.com"),
  openGraph: {
    title: business.name,
    description: shortDescription,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} ${caveat.variable}`}>
      <body className="flex min-h-screen flex-col">
        <LocalBusinessJsonLd />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-barn focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
