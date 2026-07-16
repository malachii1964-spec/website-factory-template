import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "FutureDeskAI is built by Malachi — practical AI tools for professionals and local businesses who want results, not hype.",
};

const VALUES = [
  { title: "Practical over hype", body: "No moonshot promises. Every tool targets a specific job you do today, and it's judged on whether it actually saves you time." },
  { title: "Buy once, own it", body: "One-time payments, yours forever, free updates. The only recurring thing here is the Inner Circle — and it's clearly marked." },
  { title: "Plain English, always", body: "Written for real people, not prompt engineers. If you can copy and paste, you can get results the same day." },
  { title: "A real human behind it", body: "Support you can actually reach. Feedback shapes what gets built next. This isn't a faceless template farm." },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-page py-16 lg:py-24">
          <p className="eyebrow">About FutureDeskAI</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[3rem]">
            Tools that do the work — built by someone who needed them to.
          </h1>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              I&rsquo;m Malachi. I started FutureDeskAI after watching too many
              hard-working people — tradespeople, small-business owners, busy
              professionals — lose hours and income to work that AI can handle
              in seconds, if only someone handed them the exact tools and showed
              them how.
            </p>
            <p>
              Most &ldquo;AI prompt&rdquo; products are a data dump: a hundred
              thousand unsorted prompts you&rsquo;ll never wade through. That&rsquo;s
              not help — that&rsquo;s homework. So I built the opposite: curated,
              done-for-you tools, each aimed at one real problem, written in plain
              English, ready to use today.
            </p>
            <p>
              The goal isn&rsquo;t to sell you software. It&rsquo;s to buy back your
              time — to take the draining, repetitive parts of your work off your
              plate so you can spend that time on the things only you can do.
            </p>
          </div>

          <div className="panel ticks p-8">
            <h2 className="eyebrow">What I stand on</h2>
            <div className="mt-6 flex flex-col gap-6">
              {VALUES.map((v) => (
                <div key={v.title}>
                  <h3 className="font-semibold tracking-tight text-foreground">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container-page mt-14 flex flex-col items-start gap-3 sm:flex-row">
          <Link href="/products" className={buttonVariants({ size: "lg" })}>
            Browse the tools
          </Link>
          <Link href="/membership" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Join the Inner Circle
          </Link>
        </div>
      </section>
    </>
  );
}
