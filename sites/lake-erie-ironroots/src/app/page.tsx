import Link from "next/link";
import { Hero } from "@/components/hero";
import { FarmJsonLd } from "@/components/json-ld";
import { Divider, PillarGlyph } from "@/components/ornament";
import { RegisterTable } from "@/components/record";
import { farmToday } from "@/lib/clock";
import { cuttingOn, roomNotRunning } from "@/lib/crops";
import { FARM, PILLARS } from "@/lib/farm";
import { frostLine } from "@/lib/season";

/*
  Revalidated every five minutes. The only time-dependent content is the
  dateline and the outdoor frost reading, both of which change once a day — the
  five-minute window is about the boundary being crossed promptly, not about the
  content being volatile.
*/
export const revalidate = 300;

export default function Home() {
  const today = farmToday();
  const cutting = cuttingOn(today);
  const building = roomNotRunning();

  const dateline = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <FarmJsonLd />

      <Hero />

      {/*
        Everything below rises over the sticky hero. It carries its own opaque
        ground and its own stacking context so the scene is covered cleanly
        rather than showing through.
      */}
      <div className="relative z-20 bg-void">
        {/* ------------------------------------------------- the five ---- */}
        <section className="sheet band-open" aria-labelledby="pillars">
          <h2 id="pillars" className="sr-only">
            What we hold to
          </h2>
          <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-12 p-0 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-6">
            {PILLARS.map((p) => (
              <li key={p.id} className="flex flex-col items-start">
                <span className="text-gold/75">
                  <PillarGlyph id={p.id} />
                </span>
                <h3 className="cut mt-5 text-gild">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brass">{p.body}</p>
              </li>
            ))}
          </ul>
          <Divider className="mt-16 text-gold/60 md:mt-24" />
        </section>

        {/* ---------------------------------------------------- the lead -- */}
        <section id="register" className="sheet band-work scroll-mt-24">
          <p className="cut text-stone">{dateline}</p>

          {building ? (
            <>
              <h2 className="display mt-6 max-w-[16ch] text-4xl text-gild md:text-6xl lg:text-7xl">
                Nothing is cutting yet
              </h2>
              <p className="prose-farm mt-7 text-lg">
                The room is being built. Rather than put up a page that implies
                otherwise, here is the register as it stands — what is going in,
                where it grows, and how often it will be cut. It fills in as the
                benches come online.
              </p>
            </>
          ) : (
            <>
              <h2 className="display mt-6 max-w-[18ch] text-4xl text-gild md:text-6xl lg:text-7xl">
                {cutting.length === 1
                  ? `${cutting[0].name} is cutting today`
                  : "Cutting today"}
              </h2>
              {cutting.length > 1 && (
                <ul className="mt-8 flex list-none flex-wrap gap-x-10 gap-y-2 p-0">
                  {cutting.map((c) => (
                    <li key={c.id} className="display text-2xl text-ember md:text-3xl">
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <div className="mt-16 md:mt-24">
            <RegisterTable register="bench" date={today} heading="The bench" />
            <RegisterTable register="ground" date={today} heading="The ground" />
          </div>

          <p className="cut mt-10 text-stone">Outdoors &middot; {frostLine(today)}</p>
        </section>

        {/* -------------------------------------------------- the method -- */}
        <section className="sheet band-tell border-t rule-hair">
          <h2 className="display max-w-[20ch] text-3xl text-gild md:text-5xl">
            Living soil, inside engineered hardware
          </h2>
          <p className="prose-farm mt-7 text-lg">
            Two things are true at once here. The soil is alive and slow and does
            its own work — fungi, bacteria and worms turning amendments into
            something a root can take up. The hardware around it is exact:
            gravity-fed trays, a float valve, a known volume of water. One is
            ancient, one was machined, and the point of the room is that neither
            has to give way to the other.
          </p>
          <p className="mt-9">
            <Link href="/visit" className="link text-lg">
              Come and see it
            </Link>
          </p>
        </section>

        {/* -------------------------------------------------------- close -- */}
        <section className="sheet band-close border-t rule-hair">
          <Divider className="mb-14 text-gold/50" />
          <h2 className="display text-3xl text-gild md:text-5xl">Come and get it</h2>
          <p className="prose-farm mt-6">
            Everything is grown at {FARM.address.street} in {FARM.address.locality}{" "}
            and sold from there. There is no second location.
          </p>
          <p className="mt-9">
            <Link href="/visit" className="link text-lg">
              Hours, directions and how to reach us
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
