import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, MapPin, Phone } from "lucide-react";
import { business, hoursDisplay, seasonDisplay } from "@/lib/business";
import { OpenNowBadge } from "@/components/site/open-now-badge";
import { getStandStatus } from "@/lib/hours";

const SEASON_PREVIEW = [
  { src: "/images/product-peaches-1.jpg", alt: "Baskets of ripe peaches at the stand" },
  { src: "/images/product-sweetcorn.jpg", alt: "Bushels of just-picked sweet corn, husks on" },
  { src: "/images/product-strawberries-1.jpg", alt: "Quart baskets of fresh strawberries" },
  { src: "/images/product-apples-varieties.jpg", alt: "Several New York apple varieties on display" },
  { src: "/images/product-grapes.jpg", alt: "Baskets of Concord grapes" },
  { src: "/images/product-bakery-1.jpg", alt: "Fresh sourdough loaves from Grain Bakery" },
] as const;

const REVIEWS = [
  { quote: "Nice folks, great products. The SnapDragon apples are really good.", source: "Google review" },
  { quote: "The variety at this cute little market never disappoints — and the cider is DELICIOUS.", source: "Google review" },
  { quote: "Their customer service and locally grown produce keep us coming back every summer.", source: "Google review" },
] as const;

export default function HomePage() {
  const status = getStandStatus(new Date());

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[88vh] items-end overflow-hidden sm:min-h-[92vh]">
        <Image
          src="/images/hero-market-table.jpg"
          alt="Peaches, plums, and nectarines fanned out in quart baskets on the counter at Timmerman's, with a hand-painted 'Enjoy every' sign in the background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/70 to-espresso/25"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:px-6 sm:pb-16">
          <OpenNowBadge status={status} className="mb-5 bg-paper/95" />
          <h1 className="max-w-2xl font-display text-4xl font-semibold italic leading-[1.05] text-paper sm:text-6xl">
            Still family-run.
            <br />
            Still on Route 20.
          </h1>
          <p className="mt-5 max-w-xl text-base text-paper/90 sm:text-lg">
            Mr. and Mrs. Timmerman have been setting up shop here for more
            than forty years — homegrown produce alongside the best from
            growers and bakers nearby we trust.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-peach px-5 py-3 text-sm font-semibold text-espresso transition-colors hover:bg-peach-deep"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Get Directions
            </a>
            <a
              href={business.phoneHref}
              className="inline-flex items-center gap-2 rounded-md border border-paper/40 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper backdrop-blur transition-colors hover:bg-paper/20"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {business.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Quick facts strip */}
      <section className="border-b border-cream-line bg-paper-deep">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-lg font-semibold text-barn-deep">Open {seasonDisplay}</p>
            <p className="mt-1 text-sm text-espresso-soft">{hoursDisplay}</p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-barn-deep">Grown here &amp; nearby</p>
            <p className="mt-1 text-sm text-espresso-soft">
              Some of what you&rsquo;ll find we grow ourselves; the rest comes
              from neighboring Chautauqua County growers and bakers we trust.
            </p>
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-barn-deep">Right on Route 20</p>
            <p className="mt-1 text-sm text-espresso-soft">
              Easy to spot, easy to pull into — {business.addressLine}.
            </p>
          </div>
        </div>
      </section>

      {/* Season preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="marker-tag text-xl text-barn">what&rsquo;s fresh</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-espresso sm:text-4xl">
              A look at the stand this season
            </h2>
          </div>
          <Link
            href="/season"
            className="inline-flex items-center gap-1 text-sm font-semibold text-barn-deep hover:underline"
          >
            See everything in season <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {SEASON_PREVIEW.map((item) => (
            <div key={item.src} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Trust: award + reviews */}
      <section className="bg-crate/5 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-crate-deep" aria-hidden="true" />
            <p className="font-semibold text-crate-deep">
              Voted a Top 5 finalist, Post-Journal &ldquo;Best of the Best&rdquo; 2025
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <blockquote
                key={r.quote}
                className="rounded-lg border border-cream-line bg-paper p-6 text-sm text-espresso-soft"
              >
                <p>&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-3 text-xs font-medium uppercase tracking-wide text-espresso-soft/60">
                  {r.source}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* About teaser: the signature Then & Now pairing */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md">
              <Image
                src="/images/about-then-wedding.jpg"
                alt="Mr. and Mrs. Timmerman on their wedding day, decades ago"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
            <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-lg shadow-md">
              <Image
                src="/images/about-now-portrait.jpg"
                alt="Mr. and Mrs. Timmerman together today"
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <p className="marker-tag text-xl text-barn">then &amp; now</p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-espresso sm:text-4xl">
              Forty-some years, the same two people
            </h2>
            <p className="mt-4 text-espresso-soft">
              Mr. and Mrs. Timmerman got their start together decades ago —
              and they&rsquo;re still the ones you&rsquo;ll find at the
              stand today. Their story is the whole reason this place feels
              the way it does.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-barn-deep hover:underline"
            >
              Read their story <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
