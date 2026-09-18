import Link from "next/link";
import { AutoPotFigure, SoilColumnFigure } from "@/components/figures";
import { FarmJsonLd } from "@/components/json-ld";
import { RegisterTable } from "@/components/record";
import { farmToday } from "@/lib/clock";
import { cuttingOn, roomNotRunning } from "@/lib/crops";
import { FARM, PILLARS } from "@/lib/farm";
import { frostLine } from "@/lib/season";

/*
  Revalidated every five minutes. The page's only time-dependent content is the
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

      {/* ------------------------------------------------------- the lead -- */}
      <section className="sheet band-record">
        <p className="fig text-ink-2">{dateline}</p>

        {building ? (
          <>
            <h1 className="display mt-4 max-w-[20ch] text-4xl text-ink md:text-6xl">
              Nothing is cutting yet.
            </h1>
            <p className="prose-farm mt-5 text-lg">
              The room is being built. Rather than put up a page that implies
              otherwise, here is the register as it stands — what is going in,
              where it will grow, and how often it will be cut. It will fill in
              as the benches come online.
            </p>
          </>
        ) : (
          <>
            <h1 className="display mt-4 max-w-[22ch] text-4xl text-ink md:text-6xl">
              {cutting.length === 1
                ? `${cutting[0].name} is cutting today.`
                : "Cutting today."}
            </h1>
            {cutting.length > 1 && (
              <ul className="mt-5 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
                {cutting.map((c) => (
                  <li key={c.id} className="display text-2xl text-iron">
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* -------------------------------------------------- the registers -- */}
      <section className="sheet">
        <RegisterTable register="bench" date={today} heading="The bench" />
        <RegisterTable register="ground" date={today} heading="The ground" />
        <p className="fig mt-6 text-ink-2">
          Outdoors &middot; {frostLine(today)}
        </p>
      </section>

      {/* -------------------------------------------------- how it is done -- */}
      <section className="sheet band-note rule-section">
        <h2 className="display max-w-[24ch] text-3xl text-ink md:text-4xl">
          Living soil, inside engineered hardware.
        </h2>
        <p className="prose-farm mt-5">
          Two things are true at once here. The soil is alive and slow and does
          its own work — fungi, bacteria and worms turning amendments into
          something a root can take up. The hardware around it is exact:
          gravity-fed trays, a float valve, a known volume of water. One is
          ancient and one was machined, and the point of the room is that neither
          has to compromise.
        </p>

        <div className="mt-14 grid gap-14 md:grid-cols-2 md:gap-10">
          <AutoPotFigure />
          <SoilColumnFigure />
        </div>

        <h3 className="display mt-20 text-2xl text-ink">What we hold to</h3>
        <ol className="mt-5 list-none p-0">
          {PILLARS.map((p, i) => (
            <li key={p.id} className="rule-row flex gap-5 py-5 md:gap-8">
              <span className="fig shrink-0 pt-1 text-ink-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h4 className="display text-xl text-ink">{p.title}</h4>
                <p className="mt-1 max-w-[52ch] text-ink-2">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- closing -- */}
      <section className="sheet band-close rule-section">
        <h2 className="display text-3xl text-ink md:text-4xl">
          Come and get it.
        </h2>
        <p className="prose-farm mt-4">
          Everything is grown at {FARM.address.street} and sold from there. There
          is no second location.
        </p>
        <p className="mt-7">
          <Link href="/visit" className="link text-lg">
            Hours, directions and how to reach us
          </Link>
        </p>
      </section>
    </>
  );
}
