import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandCoins, HeartHandshake, MapPin, Sprout } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Making It Affordable",
  description:
    "How Lake Erie IronRoots keeps organic vegetables affordable for low-income families — the Community Share, the Community Harvest Fund, and SNAP/EBT at the farm stand.",
};

const PIECES = [
  {
    icon: HandCoins,
    title: "The Community Share",
    body: "A weekly Harvest Box, same as anyone else's, priced on the honor system — you choose what you pay between $15 and $45 a week. No income verification, no application, no proof of anything. You know your own budget better than a form does.",
    cta: { href: "/csa", label: "See the Community Share" },
  },
  {
    icon: HeartHandshake,
    title: "The Community Harvest Fund",
    body: "Every regular-price Small and Family share, and every optional round-up at checkout, feeds a fund that keeps the Community Share tier priced below what it actually costs us to grow. If you can pay full price, you're already helping someone who can't.",
    cta: { href: "/shop", label: "Shop and it helps automatically" },
  },
  {
    icon: MapPin,
    title: "SNAP/EBT at the farm stand",
    body: "SNAP/EBT can't run through an online checkout — it requires an in-person USDA-authorized terminal. We're working on getting that authorization for our physical farm stand; once it's active, EBT will be accepted there for any in-person purchase. It isn't live yet, and we won't pretend otherwise.",
  },
  {
    icon: Sprout,
    title: "Free knowledge, always",
    body: "Growing your own food is the most permanent way to make good vegetables affordable. Our growing guides are free, no purchase required, aimed at someone growing their first plant this year — not just our customers.",
    cta: { href: "/growing-guides", label: "Learn to grow" },
  },
];

export default function CommunityPage() {
  return (
    <>
      <section className="furrow-ground border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <p className="eyebrow">Making it affordable</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            Good food shouldn&rsquo;t be a luxury.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We grow organic because we believe everyone deserves food that
            wasn&rsquo;t sprayed with something you wouldn&rsquo;t want on
            your own hands — not just people who can afford a premium.
            Here&rsquo;s the actual, concrete way we try to make that true,
            not just say it.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="grid gap-4">
            {PIECES.map((piece) => {
              const Icon = piece.icon;
              return (
                <div key={piece.title} className="panel flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:gap-6 lg:p-8">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-harvest-tint text-harvest">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-medium text-foreground">{piece.title}</h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{piece.body}</p>
                    {piece.cta && (
                      <Link
                        href={piece.cta.href}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-lake hover:underline"
                      >
                        {piece.cta.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="container-page max-w-2xl">
          <p className="eyebrow">Honest, on purpose</p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We&rsquo;re a small, new farm — not a nonprofit with a decade of
            numbers to show you. We won&rsquo;t invent statistics about how
            many families we&rsquo;ve helped. What you see here is what
            actually exists today: an honor-system share and a fund that
            grows as our regular customers do. As that changes, we&rsquo;ll
            update this page, not our marketing.
          </p>
          <Link href="/contact" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
            Questions? Reach out
          </Link>
        </div>
      </section>
    </>
  );
}
