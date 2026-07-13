import type { Metadata } from "next";
import { ArrowRight, Phone, Lightbulb, FlaskConical, Boxes, Sprout, Wrench, Users } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Container, SectionHeading, Eyebrow } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/Button";
import { PlantCard } from "@/components/PlantCard";
import { plants } from "@/lib/plants";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Hydroponics & Grower Supplies",
  description:
    "Full-spectrum grow lights, nutrients, media, and complete hydroponic systems — with staff who actually grow. Mike's Nursery, Lakewood NY.",
};

const supplies = plants.filter((p) => p.category === "hydroponics");

const pillars = [
  {
    icon: Lightbulb,
    title: "Full-spectrum lighting",
    body: "Efficient LED fixtures for every stage and tent size — low heat, real output, honest advice on coverage.",
  },
  {
    icon: FlaskConical,
    title: "Nutrients & feeding",
    body: "Complete feed lineups for soil and hydro. Tell us what you're running and we'll map the schedule.",
  },
  {
    icon: Boxes,
    title: "Systems & media",
    body: "Deep-water, drip, and ebb-and-flow kits, plus coco, rockwool, perlite, and premium mixes by the bag.",
  },
  {
    icon: Sprout,
    title: "Propagation",
    body: "Domes, plugs, heat mats, and everything to take cuttings and seedlings from start to strong.",
  },
  {
    icon: Wrench,
    title: "Setup help",
    body: "New to indoor growing? We'll spec a full tent from the ground up so you don't buy twice.",
  },
  {
    icon: Users,
    title: "Growers on staff",
    body: "The people behind the counter run these systems at home. You get answers, not a shrug.",
  },
];

export default function HydroponicsPage() {
  return (
    <>
      <PageHero
        eyebrow="The grow room"
        title={
          <>
            Grow anything,
            <br />
            any season.
          </>
        }
        intro="Behind the greenhouses is a full hydroponics and indoor-growing department — the reason serious growers drive across the state to shop with us."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/plants?category=hydroponics" variant="primary" size="lg">
            Shop supplies
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
          <ButtonLink
            href={site.phoneHref}
            variant="outline"
            size="lg"
            className="border-paper/30 text-paper hover:bg-paper hover:text-fir"
          >
            <Phone size={17} aria-hidden />
            Talk to a grower
          </ButtonLink>
        </div>
      </PageHero>

      {/* Pillars */}
      <section className="py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What we carry"
              title="Everything the grow room needs"
              intro="Whether you're starting your first tent or dialing in a room, we stock the gear and know how to use it."
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={(i % 3) * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-mist bg-white/50 p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-canopy/10 text-canopy">
                    <p.icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-xl text-canopy">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-loam-soft">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Supplies grid */}
      <section className="bg-paper-dim py-20 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="On the shelves" title="Grower supplies" />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supplies.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <PlantCard plant={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-fir py-20 text-paper sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 glow-grow opacity-60 blur-2xl" />
        <Container className="relative text-center">
          <Eyebrow className="justify-center text-grow">No guesswork</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            Tell us what you&rsquo;re growing. We&rsquo;ll build the setup.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-paper/75">
            Bring your space and your goals — we&rsquo;ll spec lighting, nutrients, and a
            system that fits your budget and your room.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={site.phoneHref} variant="primary" size="lg">
              <Phone size={17} aria-hidden />
              Call {site.phone}
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="outline"
              size="lg"
              className="border-paper/30 text-paper hover:bg-paper hover:text-fir"
            >
              Send a question
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
