import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "What's in Season",
  description:
    "Fruit, vegetables, and baked goods at Timmerman's Farm and Market in Westfield, NY — from peaches and sweet corn to sourdough from Grain Bakery.",
};

type Item = { src: string; alt: string; name: string };

const FRUIT: Item[] = [
  { src: "/images/product-peaches-1.jpg", name: "Peaches", alt: "Baskets of ripe peaches" },
  { src: "/images/product-plums.jpg", name: "Plums & Nectarines", alt: "Baskets of dark plums and red nectarines" },
  { src: "/images/product-strawberries-1.jpg", name: "Strawberries", alt: "Quart baskets of strawberries" },
  { src: "/images/product-blueberries.jpg", name: "Blueberries", alt: "Boxes of fresh blueberries" },
  { src: "/images/product-apples-1.jpg", name: "Apples", alt: "Boxes of apples" },
  { src: "/images/product-apples-varieties.jpg", name: "Apple Varieties", alt: "Several labeled New York apple varieties" },
  { src: "/images/product-apples-fall.jpg", name: "Fall Apples", alt: "Bagged apples at the stand in autumn" },
  { src: "/images/product-pears-plums.jpg", name: "Pears & Plums", alt: "Baskets of pears and plums" },
  { src: "/images/product-grapes.jpg", name: "Concord Grapes", alt: "Baskets of Concord grapes" },
];

const VEGETABLES: Item[] = [
  { src: "/images/product-sweetcorn.jpg", name: "Sweet Corn", alt: "Bushels of sweet corn, husks on" },
  { src: "/images/product-tomatoes-1.jpg", name: "Tomatoes", alt: "Boxes of ripe tomatoes" },
  { src: "/images/product-peppers.jpg", name: "Peppers", alt: "Baskets of orange, red, and green peppers" },
  { src: "/images/product-onions.jpg", name: "Onions & Garlic", alt: "Baskets of onions and garlic" },
  { src: "/images/product-asparagus.jpg", name: "Asparagus", alt: "Bundles of fresh asparagus" },
  { src: "/images/product-rhubarb.jpg", name: "Rhubarb", alt: "Bundles of rhubarb" },
  { src: "/images/product-squash.jpg", name: "Winter Squash", alt: "Assorted winter squash and gourds" },
  { src: "/images/product-cabbage.jpg", name: "Cabbage", alt: "Heads of cabbage" },
];

const BAKERY: Item[] = [
  { src: "/images/product-bakery-1.jpg", name: "Sourdough (Grain Bakery)", alt: "Fresh sourdough loaves" },
  { src: "/images/product-bakery-2.jpg", name: "Pies & Baked Goods", alt: "Pies, muffins, and baked goods" },
  { src: "/images/product-preserves.jpg", name: "Jams & Preserves", alt: "Jars of jam and preserves" },
  { src: "/images/product-jars.jpg", name: "Honey & Maple Syrup", alt: "Jars of local honey and maple syrup" },
];

function Section({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="font-display text-2xl font-semibold text-espresso sm:text-3xl">{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {items.map((item) => (
          <figure key={item.src} className="group">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                loading="lazy"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <figcaption className="mt-2 text-sm font-medium text-espresso-soft">{item.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default function SeasonPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="marker-tag text-xl text-barn">what&rsquo;s in season</p>
      <h1 className="mt-1 font-display text-4xl font-semibold italic text-espresso sm:text-5xl">
        Fresh from the stand
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-espresso-soft">
        What&rsquo;s on the tables changes week to week with the season.
        Some of it&rsquo;s homegrown; the rest comes from other Chautauqua
        County growers and bakers we trust — including sourdough and pies
        from Grain Bakery down the road. Ask at the register what came off
        Timmerman land that day.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={business.phoneHref}
          className="inline-flex items-center gap-2 rounded-md bg-barn px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call ahead for today&rsquo;s picks
        </a>
        <Link
          href="/visit"
          className="inline-flex items-center gap-2 rounded-md border border-cream-line px-5 py-3 text-sm font-semibold text-espresso-soft transition-colors hover:bg-paper-deep"
        >
          Hours &amp; directions
        </Link>
      </div>

      <Section title="Fruit" items={FRUIT} />
      <Section title="Vegetables" items={VEGETABLES} />
      <Section title="Bakery, Honey & Preserves" items={BAKERY} />

      <p className="mt-14 text-sm text-espresso-soft/70">
        Availability changes with the weather and the week — the surest way
        to know what&rsquo;s fresh today is to call {business.phone} or stop by.
      </p>
    </div>
  );
}
