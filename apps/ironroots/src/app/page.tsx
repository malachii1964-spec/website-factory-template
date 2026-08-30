import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HandCoins,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Snowflake,
  Sprout,
  Truck,
} from "lucide-react";
import { products, categories } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { ProductIcon } from "@/lib/icons";
import { HarvestWheel } from "@/components/harvest-wheel";
import { buttonVariants } from "@/components/ui/button";

const FEATURED_SLUGS = [
  "weekly-harvest-box-small",
  "butterhead-lettuce",
  "greenhouse-cherry-tomatoes",
  "genovese-basil",
  "rainbow-carrots",
  "heirloom-tomatoes",
];

const PILLARS = [
  {
    icon: Snowflake,
    title: "Grown through winter, not just summer",
    body: "Hydroponic greenhouse beds keep greens, herbs, and tomatoes coming even when the lake is frozen over.",
  },
  {
    icon: Clock,
    title: "Hours old, not weeks old",
    body: "Most produce is cut or pulled within a day of pickup — not trucked in from three states away.",
  },
  {
    icon: MapPin,
    title: "Sold to our own county",
    body: "We grow for the people down the road, not a regional distribution warehouse.",
  },
];

const MISSION = [
  {
    icon: Sprout,
    title: "Grown organic, grown vigorously",
    body: "No synthetic pesticides, ever — just soil, attention, and plants pushed to actually thrive, not just survive.",
    cta: { href: "/growing-guides#why-organic", label: "Why organic matters" },
  },
  {
    icon: HandCoins,
    title: "Priced for a low-income family, not around one",
    body: "A pay-what-you-can Community Share, funded by everyone else who shops here — top-of-the-line organic produce shouldn't be a luxury item.",
    cta: { href: "/community", label: "See how it works" },
  },
  {
    icon: HeartHandshake,
    title: "Built to inspire you to grow your own",
    body: "Free growing guides and greenhouse-hardened seedlings, because the most affordable vegetable is the one you grew yourself.",
    cta: { href: "/growing-guides", label: "Learn to grow" },
  },
];

export default function HomePage() {
  const featured = FEATURED_SLUGS.map((slug) => products.find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="furrow-ground relative overflow-hidden border-b border-border">
        <div className="container-page relative grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="fade-up">
            <p className="eyebrow flex items-center gap-2">
              <Sprout className="h-3.5 w-3.5" />
              Lake Erie shoreline · organic · grown for this county
            </p>
            <h1 className="mt-5 text-[2.5rem] font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.3rem]">
              Top-of-the-line organic vegetables —{" "}
              <span className="italic text-lake">priced so everyone can eat this well.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              We grow organic, year-round, a few miles from your table — and
              we built a pay-what-you-can share specifically so a tight
              grocery budget isn&rsquo;t a reason to eat worse food. Good
              vegetables shouldn&rsquo;t be a luxury item.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className={buttonVariants({ size: "lg" })}>
                Shop this week&rsquo;s harvest
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/community" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See the Community Share
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["100% organic, no synthetic pesticides", "Pay-what-you-can share available", "Free growing guides for everyone"].map(
                (f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-leaf" />
                    {f}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Harvest Wheel — the signature */}
          <div className="fade-up relative" style={{ animationDelay: "120ms" }}>
            <div className="panel overflow-hidden shadow-[0_1px_2px_rgba(20,20,30,0.04),0_24px_60px_-24px_rgba(20,35,20,0.24)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <span className="text-sm font-medium text-foreground">This month on the farm</span>
                <span className="text-[0.68rem] uppercase tracking-widest text-muted-foreground">
                  live
                </span>
              </div>
              <div className="p-5">
                <HarvestWheel activeMonths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} compact />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Every dot is a month our hydroponic greens, herbs, and
                  storage crops are actually available — not a marketing
                  promise. Check any product page for its own calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="container-page">
          <p className="eyebrow">Why this farm exists</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Growing good food, and the people who grow it
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Our mission isn&rsquo;t just to sell vegetables. It&rsquo;s to
            grow the best, healthiest organic food we can, make it something
            a low-income family can actually afford, and get more people in
            this county growing their own.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {MISSION.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.title}
                  href={m.cta.href}
                  className="panel lift group flex flex-col p-6 hover:border-harvest"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-harvest-tint text-harvest">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-4 font-medium text-foreground">{m.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-lake">
                    {m.cta.label}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PILLARS ──────────────────────────────────────────────── */}
      <section className="border-b border-border py-16 lg:py-20">
        <div className="container-page">
          <p className="eyebrow">What makes it different</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Grown different, not just grown local
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="panel p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-leaf-tint text-leaf">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-4 font-medium text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-16 lg:py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The shop</p>
              <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Everything we&rsquo;re harvesting
              </h2>
            </div>
            <Link href="/shop" className="hidden shrink-0 text-sm font-medium text-lake hover:underline sm:inline">
              View all →
            </Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const sample = products.find((p) => p.category === cat.id);
              const count = products.filter((p) => p.category === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className="panel lift group flex items-start gap-4 p-5 hover:border-lake"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-leaf-tint text-leaf">
                    <ProductIcon name={sample?.icon ?? "leaf"} className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{cat.label}</h3>
                      <span className="text-[0.62rem] text-muted-foreground">{count}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────────── */}
      <section className="border-b border-border py-20">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Popular this week</p>
              <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
                Start with what people keep reordering
              </h2>
            </div>
            <Link href="/shop" className="shrink-0 text-sm font-medium text-lake hover:underline">
              All {products.length} →
            </Link>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CSA CTA ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Harvest Box CSA</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Never think about it again — a fresh box shows up every week
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              Subscribe once and we hand-pack a mix of whatever&rsquo;s
              actually at peak on the farm — pause anytime, cancel anytime, no
              contract.
            </p>
            <Link href="/csa" className={buttonVariants({ size: "lg", className: "mt-7" })}>
              See the CSA
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="panel p-8">
            <div className="flex flex-col gap-4">
              {[
                { k: "Packed", v: "Every Thursday" },
                { k: "Pickup or delivery", v: "Farm stand + county-wide" },
                { k: "Commitment", v: "None — pause or cancel" },
                { k: "Starting at", v: "$15 / week (Community Share)" },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="eyebrow">{row.k}</span>
                  <span className="text-sm font-medium text-foreground">{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="furrow-ground relative overflow-hidden py-24">
        <div className="container-page relative text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Real vegetables, grown for this county, all year.
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            No brokers, no cold-storage warehouses three states away. Just a
            farm on the lake, picking what&rsquo;s ready.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className={buttonVariants({ size: "lg" })}>
              Shop the harvest
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Truck className="h-4 w-4" />
              Our farm
            </Link>
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure checkout via Stripe · pay online, pick up local
          </p>
        </div>
      </section>
    </>
  );
}
