import type { Metadata } from "next";
import "./globals.css";
import { display, body, mono } from "@/lib/fonts";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { site } from "@/lib/site";

const SITE_URL = `https://www.${site.domain}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chautauqua County Courier — One call. Consider it done.",
    template: "%s · Chautauqua County Courier",
  },
  description:
    "Countywide delivery, errands, and concierge runs across Chautauqua County, NY. One local call gets almost anything legal picked up, delivered, or handled — one price, agreed before we go. Based in Westfield.",
  keywords: [
    "Chautauqua County delivery",
    "Westfield NY courier",
    "errand service Chautauqua County",
    "local delivery Jamestown NY",
    "senior errand service",
    "seasonal home concierge Chautauqua Lake",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Chautauqua County Courier — One call. Consider it done.",
    description:
      "Countywide delivery, errands, and concierge runs. One local call, one price agreed before we go.",
    siteName: site.name,
  },
};

// LocalBusiness schema — helps the business get found in local search.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CourierService",
  name: site.name,
  description:
    "Countywide delivery, errands, and concierge runs across Chautauqua County, NY.",
  telephone: `+1${site.phoneDigits}`,
  areaServed: { "@type": "AdministrativeArea", name: "Chautauqua County, New York" },
  address: { "@type": "PostalAddress", addressLocality: "Westfield", addressRegion: "NY", addressCountry: "US" },
  url: SITE_URL,
  slogan: site.tagline,
};

// Apply the saved theme before first paint. Default is the warm-paper LIGHT
// theme (senior-friendly); an explicit saved choice always wins.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
