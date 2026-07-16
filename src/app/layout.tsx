import type { Metadata } from "next";
import "./globals.css";
import { plexSans, plexMono } from "@/lib/fonts";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AnnouncementBar } from "@/components/site/announcement-bar";

const SITE_URL = "https://www.futuredeskai.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FutureDeskAI — AI tools that do the work",
    template: "%s · FutureDeskAI",
  },
  description:
    "Battle-tested AI prompt packs, templates, industry automation kits, and courses for professionals and local businesses. Buy once, download instantly, get results today.",
  keywords: [
    "AI prompts",
    "AI templates",
    "Notion templates",
    "local business automation",
    "prompt engineering",
    "FutureDeskAI",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "FutureDeskAI — AI tools that do the work",
    description:
      "Battle-tested AI prompt packs, templates, industry automation kits, and courses. Buy once, download instantly.",
    siteName: "FutureDeskAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "FutureDeskAI — AI tools that do the work",
    description:
      "Battle-tested AI prompt packs, templates, industry automation kits, and courses.",
  },
};

// Applies the saved theme before first paint to prevent a flash.
// Defaults to the dark "command deck" ground; respects an explicit saved choice.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t?t==='dark':true);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
