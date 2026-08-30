import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Package,
  Recycle,
  Sprout,
  Sun,
  Thermometer,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Learn to Grow",
  description:
    "Free, plain-English guides to growing your own organic vegetables — starting seeds, container gardening with no yard, composting, and why organic actually matters.",
};

const GUIDES = [
  {
    id: "first-plant",
    icon: Sprout,
    title: "Your first plant: start with a tomato",
    body: [
      "If you've never grown anything before, start with a tomato. It forgives mistakes, tells you what it needs (droopy in the morning means water, droopy at 2pm in full sun is normal), and rewards you fast.",
      "Give it at least 6 hours of direct sun, a container or bed at least 5 gallons in size, and water deeply when the top inch of soil is dry — not on a schedule, on what the soil actually tells you.",
      "One of our greenhouse-hardened tomato starts, already a few weeks ahead of a seed, is the fastest way to get a plant in the ground this week.",
    ],
  },
  {
    id: "no-yard",
    icon: Sun,
    title: "No yard? No problem.",
    body: [
      "A porch, a fire escape, or a single sunny windowsill is enough to grow real food. Herbs (basil, parsley, mint) only need a 6-inch pot. Peppers and compact tomato varieties do well in a 5-gallon bucket with drainage holes drilled in the bottom.",
      "Use a bagged potting mix, not soil dug from the ground — container plants need something lighter that drains well. A cheap moisture meter (or just your finger, an inch deep) tells you when to water.",
      "You don't need a farm to grow food. You need a few hours of sun and a container.",
    ],
  },
  {
    id: "seed-starting",
    icon: Package,
    title: "Starting seeds indoors",
    body: [
      "Seeds started indoors 6–8 weeks before your last frost date get a head start most direct-sown plants can't catch. All you need: a shallow tray, seed-starting mix (finer than potting soil, low in nutrients on purpose), a sunny south-facing window or a cheap grow light, and patience.",
      "Keep the mix moist, not soaked. Once seedlings have their second set of true leaves, start 'hardening off' — setting them outside for a little longer each day over a week — before transplanting, so they don't get shocked by real sun and wind.",
      "Skip this step entirely by starting with one of our own greenhouse seedlings — already hardened off and ready to transplant.",
    ],
  },
  {
    id: "composting",
    icon: Recycle,
    title: "Composting basics",
    body: [
      "Composting is just controlled rot: food scraps and yard waste broken down by microbes into rich, dark soil. You need roughly equal parts 'greens' (vegetable scraps, coffee grounds) and 'browns' (dry leaves, cardboard, straw), kept about as damp as a wrung-out sponge.",
      "Turn the pile every week or two to add oxygen, which keeps it breaking down instead of going anaerobic and smelly. No yard for a pile? A small countertop or apartment-balcony bin with worms (vermicomposting) does the same job in less space.",
      "Finished compost is the single best thing you can add to a garden bed or container — better than any bagged fertilizer, and it costs nothing but scraps and time.",
    ],
  },
  {
    id: "why-organic",
    icon: Leaf,
    title: "Why organic actually matters",
    body: [
      "Organic isn't a marketing word to us — it means no synthetic pesticides or herbicides on anything we grow, which matters for the soil life (worms, fungi, bacteria) that makes vegetables taste like something and keeps growing them sustainable year after year.",
      "It also means what you're eating hasn't been sprayed with anything you wouldn't want on your own hands. Organic growing is slower and takes more attention than spraying a problem away — but it's the only way we're willing to grow food for our own families, so it's the only way we grow it for yours.",
    ],
  },
  {
    id: "lake-erie-season",
    icon: Thermometer,
    title: "Growing on the Lake Erie shoreline",
    body: [
      "This stretch of shoreline sits in a mild pocket — the lake holds summer heat into fall and delays spring's first warm days, which stretches the growing season on both ends compared to inland spots just a few miles away.",
      "It's still a real winter. That's exactly why we grow greens and herbs hydroponically in a heated greenhouse instead of pretending an open field can do it — and why our seedlings aren't ready to go outside until after the last frost, typically mid-to-late May here.",
    ],
  },
];

export default function GrowingGuidesPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <p className="eyebrow">Learn to grow</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            You don&rsquo;t need our farm. You need a start and a place to put it.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Growing your own food shouldn&rsquo;t require money, land, or
            experience you don&rsquo;t have yet. These are the same basics we
            used when we started — free, plain-English, and aimed at someone
            growing their first plant this year.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="grid gap-4">
            {GUIDES.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.id} id={guide.id} className="panel scroll-mt-24 p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-leaf-tint text-leaf">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-medium text-foreground">
                        {guide.title}
                      </h2>
                      <div className="mt-3 flex flex-col gap-3">
                        {guide.body.map((p, i) => (
                          <p key={i} className="leading-relaxed text-muted-foreground">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-16">
        <div className="container-page">
          <div className="panel flex flex-col items-start gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-medium text-foreground">Ready to plant something?</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                Greenhouse-hardened seedlings and a beginner starter kit — no
                seed-starting required.
              </p>
            </div>
            <Link
              href="/shop?category=seedlings-starts"
              className={buttonVariants({ size: "lg" })}
            >
              Shop seedlings &amp; starts
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
