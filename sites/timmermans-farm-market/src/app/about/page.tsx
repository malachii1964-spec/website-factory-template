import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story behind Timmerman's Farm and Market — a family-run fruit stand on Route 20 in Westfield, NY, run by Mr. and Mrs. Timmerman for more than four decades.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="marker-tag text-xl text-barn">about us</p>
      <h1 className="mt-1 font-display text-4xl font-semibold italic text-espresso sm:text-5xl">
        Forty-some years, the same two people
      </h1>
      <p className="mt-5 text-lg text-espresso-soft">
        Documented ads for the stand go back to 1983 — more than four
        decades of summers along this same stretch of Route 20. Today it&rsquo;s
        Mr. and Mrs. Timmerman you&rsquo;ll find behind the counter, same as
        they have been for as long as most of Westfield can remember.
      </p>

      {/* The signature: Then & Now */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <figure className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
          <Image
            src="/images/about-then-wedding.jpg"
            alt="Mr. and Mrs. Timmerman's wedding day, decades ago, in an outdoor ceremony"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
          <figcaption className="absolute bottom-0 left-0 right-0 bg-espresso/80 px-4 py-2 text-center font-display text-sm italic text-paper">
            Then
          </figcaption>
        </figure>
        <figure className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-lg">
          <Image
            src="/images/about-now-portrait.jpg"
            alt="Mr. and Mrs. Timmerman together today"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
          <figcaption className="absolute bottom-0 left-0 right-0 bg-espresso/80 px-4 py-2 text-center font-display text-sm italic text-paper">
            Now
          </figcaption>
        </figure>
      </div>

      <div className="prose-farm mt-14 space-y-6 text-espresso-soft">
        <p>
          Somewhere behind the register there&rsquo;s a photograph from an
          old red Volkswagen Beetle, &ldquo;JUST MARRIED&rdquo; chalked
          across the back window in handwriting from a lifetime ago. It sits
          near photos from the wedding itself — long before the peach
          crates, the pallets of pumpkins on the lawn every October, and the
          hand-lettered signs that have priced everything at the stand ever
          since.
        </p>

        <div className="not-prose my-10 flex justify-center">
          <figure className="w-full max-w-sm">
            <div className="relative aspect-[7/8] overflow-hidden rounded-lg shadow-md">
              <Image
                src="/images/about-just-married-car.jpg"
                alt="An old red Volkswagen Beetle with 'JUST MARRIED' written in chalk on the back window"
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                loading="lazy"
                className="object-cover"
              />
            </div>
          </figure>
        </div>

        <p>
          That&rsquo;s the whole reason the place feels the way it does. This
          isn&rsquo;t a stand that changed hands, got a rebrand, and kept the
          name for the sentiment. It&rsquo;s the same two people, showing up
          every season, for longer than most of their customers have been
          alive.
        </p>

        <h2 className="pt-4 font-display text-2xl font-semibold text-espresso">
          Part of Westfield, not just parked on it
        </h2>
        <p>
          Look at the community board by the door and you&rsquo;ll usually
          find a fundraiser flyer or two taped up next to the price list.
          Mr. Timmerman is a Vietnam veteran, and between the two of them
          you&rsquo;d be hard pressed to find a local cause — the volunteer
          fire department included — that they haven&rsquo;t quietly shown
          up for.
        </p>

        <div className="not-prose my-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src="/images/about-community.jpg"
              alt="Mr. and Mrs. Timmerman at a community event, carrying a Westfield Volunteer Firemen's Association tote bag"
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src="/images/about-harvest-frame.jpg"
              alt="Mr. and Mrs. Timmerman at a local harvest festival"
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image
              src="/images/stand-signage.jpg"
              alt="Hand-lettered price signs and fresh sourdough loaves at the stand"
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              loading="lazy"
              className="object-cover"
            />
          </div>
        </div>

        <h2 className="pt-4 font-display text-2xl font-semibold text-espresso">
          What&rsquo;s actually grown here
        </h2>
        <p>
          We&rsquo;d rather tell you straight than let you assume. Some of
          what&rsquo;s on the tables — peaches, sweet corn, tomatoes, and
          more, depending on the week — comes off Timmerman land. The rest
          comes from other Chautauqua County growers and bakers the family
          has bought from for years and stands behind: sourdough and pies
          from Grain Bakery just down the road, eggs and cheese from
          neighboring farms. If you ask what&rsquo;s homegrown that day,
          whoever&rsquo;s at the register will tell you straight.
        </p>

        <p>
          In 2025, the stand was voted a Top 5 finalist in the Post-Journal&rsquo;s
          &ldquo;Best of the Best&rdquo; — decided by the same neighbors
          who&rsquo;ve been driving out to Route 20 for their sweet corn
          every July for years.
        </p>
      </div>

      <div className="mt-14 rounded-lg border border-cream-line bg-paper-deep p-8 text-center">
        <p className="font-display text-2xl italic text-espresso">
          Come see us for yourself.
        </p>
        <Link
          href="/visit"
          className="mt-4 inline-flex items-center gap-1 rounded-md bg-barn px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep"
        >
          Plan your visit <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
