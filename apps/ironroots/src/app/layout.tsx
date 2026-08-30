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
    default: "Lake Erie IronRoots — Organic vegetables, priced for everyone",
    template: "%s · Lake Erie IronRoots",
  },
  description:
    "A Lake Erie shoreline farm growing organic vegetables year-round for our own county — a pay-what-you-can Community Share, free growing guides, and greenhouse-hardened seedlings so everyone can eat, and grow, well.",
  keywords: [
    "Lake Erie farm",
    "organic vegetables",
    "affordable CSA",
    "sliding scale CSA",
    "low income food access",
    "grow your own vegetables",
    "IronRoots",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Lake Erie IronRoots — Organic vegetables, priced for everyone",
    description:
      "Organic produce, a pay-what-you-can Community Share, and free growing guides — grown on the Lake Erie shoreline, for our own county.",
    siteName: "Lake Erie IronRoots",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lake Erie IronRoots — Organic vegetables, priced for everyone",
    description:
      "Organic produce, a pay-what-you-can Community Share, and free growing guides, grown on the Lake Erie shoreline.",
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
