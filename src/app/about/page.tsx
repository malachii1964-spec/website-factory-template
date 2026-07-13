import type { Metadata } from "next";
import { ArrowRight, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container, SectionHeading, Eyebrow } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/Button";
import { PlantArt } from "@/components/PlantArt";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Mike's Nursery",
  description:
    "Family-owned since the 1980s, Mike's Nursery grew from a single greenhouse into Western New York's largest nursery and hydroponics shop.",
};

const values = [
  {
    title: "Grown here, not trucked in",
    body: "Most of what you buy was started and raised in our own greenhouses — so it's healthy, hardened off, and ready for a Western New York season.",
  },
  {
    title: "Advice you can trust",
    body: "We'd rather sell you the right plant once than the wrong one twice. Ask anything — our staff garden and grow themselves.",
  },
  {
    title: "For every kind of grower",
    body: "First tomato plant or fiftieth harvest, backyard bed or indoor tent — you're welcome here, and you'll leave knowing more.",
  },
];

const milestones = [
  { year: site.founded, label: "One greenhouse", body: "Mike opens the doors with a single greenhouse and a truck." },
  { year: 1999, label: "Growing roots", body: "Second greenhouse added as the community keeps coming back." },
  { year: 2012, label: "The grow room", body: "Hydroponics department opens for serious indoor growers." },
  { year: "Today", label: "Three greenhouses", body: "The region's largest nursery and grower-supply shop." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="A family greenhouse that grew."
        intro={`From one greenhouse and a pickup truck to three greenhouses and a full grow room — Mike's has been rooted in Lakewood since ${site.founded}.`}
      />

      {/* Story + art */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="max-w-lg">
                <Eyebrow>Rooted in Lakewood</Eyebrow>
                <h2 className="mt-4 font-display text-3xl leading-tight text-canopy sm:text-4xl">
                  We measure success in return visits.
                </h2>
                <div className="mt-5 space-y-4 text-lg leading-relaxed text-loam-soft">
                  <p>
                    Mike started with a single greenhouse and a simple idea: sell healthy
                    plants, give honest advice, and treat people like neighbors — because
                    they are.
                  </p>
                  <p>
                    Decades later, that hasn&rsquo;t changed. We&rsquo;ve just grown to
                    three greenhouses, added a hydroponics department for the serious
                    growers, and kept the same benches full of plants we raised ourselves.
                  </p>
                  <p>
                    When you shop with us, you&rsquo;re not getting a big-box garden
                    section. You&rsquo;re getting a family that&rsquo;s been doing this a
                    long time, and genuinely wants your garden to thrive.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-mist">
                  <PlantArt category="trees-shrubs" hue={140} label="Greenhouse trees" />
                </div>
                <div className="mt-8 aspect-[3/4] overflow-hidden rounded-2xl border border-mist">
                  <PlantArt category="hanging-baskets" hue={320} label="Hanging baskets" />
                </div>
                {/* TODO(mike): replace these two panels with real greenhouse photos. */}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="bg-fir py-20 text-paper sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="How we grew" title="Three greenhouses, one family" tone="light" />
          </Reveal>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m, i) => (
              <Reveal key={m.label} delay={(i % 4) * 80} as="li">
                <div className="flex h-full flex-col rounded-2xl border border-paper/12 bg-paper/[0.04] p-6">
                  <span className="font-display text-3xl text-grow">{m.year}</span>
                  <span className="mt-2 font-semibold text-paper">{m.label}</span>
                  <p className="mt-2 text-sm leading-relaxed text-paper/70">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <p className="mt-6 text-xs text-paper/50">
            {/* TODO(mike): confirm real dates/milestones for the timeline. */}
            Timeline shown for illustration — we&rsquo;ll set the real dates with Mike.
          </p>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="What we stand for" title="The way we do things" align="center" />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-mist bg-white/50 p-6">
                  <h3 className="font-display text-xl text-canopy">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-loam-soft">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-paper-dim py-16">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl font-display text-3xl leading-tight text-canopy sm:text-4xl">
            Come walk the greenhouses.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/contact" variant="ground" size="lg">
              Plan your visit
              <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <ButtonLink href={site.phoneHref} variant="outline" size="lg">
              <Phone size={17} aria-hidden />
              {site.phone}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
