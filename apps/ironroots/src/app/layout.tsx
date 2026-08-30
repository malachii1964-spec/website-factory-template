import type { Metadata } from "next";
import "./globals.css";
import { fraunces, publicSans } from "@/lib/fonts";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CartProvider } from "@/components/cart-provider";

const SITE_URL = "https://www.lakeerieironroots.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lake Erie IronRoots — Fresh vegetables, grown local, year-round",
    template: "%s · Lake Erie IronRoots",
  },
  description:
    "A Lake Erie shoreline farm growing the best-tasting, healthiest vegetables year-round for our own county — hydroponic greens, field-grown roots, and a weekly Harvest Box CSA.",
  keywords: [
    "Lake Erie farm",
    "local vegetables",
    "CSA subscription",
    "hydroponic greens",
    "farm stand",
    "IronRoots",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Lake Erie IronRoots — Fresh vegetables, grown local, year-round",
    description:
      "Hydroponic greens, field-grown roots, and a weekly Harvest Box CSA — grown on the Lake Erie shoreline, for our own county.",
    siteName: "Lake Erie IronRoots",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lake Erie IronRoots — Fresh vegetables, grown local, year-round",
    description:
      "Hydroponic greens, field-grown roots, and a weekly Harvest Box CSA, grown on the Lake Erie shoreline.",
  },
};

// Applies the saved theme before first paint to prevent a flash. Defaults to
// light (the produce-forward "greenhouse morning" ground); respects an
// explicit saved choice.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <CartProvider>
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
