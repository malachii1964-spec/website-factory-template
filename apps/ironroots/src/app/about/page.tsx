import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, Snowflake, Sprout, Warehouse } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HarvestWheel } from "@/components/harvest-wheel";

export const metadata: Metadata = {
  title: "Our Farm",
  description:
    "Why Lake Erie IronRoots grows year-round for its own county — hydroponic greenhouses, careful storage, and no brokers in between.",
};

const METHODS = [
  {
    icon: Droplets,
    title: "Hydroponic greenhouses",
    body: "Lettuce, spinach, herbs, and cherry tomatoes grow in climate-controlled beds that don't care what the lake is doing outside. This is what makes the year-round promise real, not marketing.",
  },
  {
    icon: Snowflake,
    title: "High tunnels for the shoulder seasons",
    body: "Unheated but covered ground that stretches field crops like kale, chard, and tomatoes weeks further into fall and spring than open field alone.",
  },
  {
    icon: Warehouse,
    title: "Proper storage, not shortcuts",
    body: "Potatoes, onions, garlic, and squash are cured and kept cool on purpose, so winter produce doesn't mean flown-in produce.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="container-page py-16 lg:py-20">
          <p className="eyebrow">Our farm</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            A farm built to stay open all year.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Lake Erie IronRoots exists for one reason: our county deserves
            fresh, honest vegetables every month of the year, not just the
            five or six that a typical field farm can manage. Everything we
            grow, we grow to eat well and sell close to home.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-surface py-16">
        <div className="container-page">
          <p className="eyebrow">How we get to &ldquo;all year&rdquo;</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Three growing methods, stacked to close the gap
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="panel p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-leaf-tint text-leaf">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-4 font-medium text-foreground">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border py-16">
        <div className="container-page max-w-2xl">
          <p className="eyebrow">The result</p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            A calendar with almost nothing blank
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Stack hydroponic, high-tunnel, and stored crops together and the
            gaps mostly disappear. Every product page shows its own real
            calendar — here&rsquo;s the farm-wide picture:
          </p>
          <div className="mt-6">
            <HarvestWheel activeMonths={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="panel flex flex-col items-start gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Sprout className="mt-1 h-8 w-8 shrink-0 text-leaf" />
              <div>
                <h2 className="font-medium text-foreground">Grown here, sold here.</h2>
                <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                  No brokers, no distribution warehouse, no unmarked truck. If
                  you buy it from us, we grew it.
                </p>
              </div>
            </div>
            <Link href="/shop" className={buttonVariants({ size: "lg" })}>
              Shop the harvest
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
