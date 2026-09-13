import type { Metadata } from "next";
import Link from "next/link";
import { FarmJsonLd } from "@/components/json-ld";
import { RootLine } from "@/components/root-line";
import { humanTime } from "@/components/site-footer";
import {
  FARM,
  formattedPhone,
  hasRealContactDetails,
} from "@/lib/farm";
import { farmToday } from "@/lib/clock";
import { frostLine, readyOn } from "@/lib/season";

// See the note on src/app/page.tsx — same five-minute window, same caveat.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Visit the stand",
  description: `Hours, directions and what is ready at ${FARM.name} in ${FARM.address.locality}, ${FARM.state}.`,
};

const SHELL = "mx-auto w-full max-w-6xl px-5 md:pr-8 md:pl-32";

export default function VisitPage() {
  const today = farmToday();
  const ready = readyOn(today);
  const real = hasRealContactDetails();
  const mapQuery = encodeURIComponent(
    `${FARM.address.street}, ${FARM.address.locality}, ${FARM.address.region} ${FARM.address.postalCode}`,
  );

  return (
    <>
      <FarmJsonLd />
      <RootLine />

      <section className={`${SHELL} py-16 md:py-24`}>
        <p className="label">Visit</p>
        <h1 className="display mt-5 text-4xl md:text-6xl">
          Come to the stand
        </h1>
        <p className="prose-farm mt-6 text-base md:text-lg">
          Everything is picked here and sold here. There is no warehouse and no
          second location — what is on the table this morning is what came out
          of the field this morning.
        </p>
        <p className="label mt-8 text-ember">{frostLine(today)}</p>
      </section>

      <section className="relative z-40 bg-parchment text-[#3A2E20]">
        <div className={`${SHELL} py-16 md:py-24`}>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {/* ---------------------------------------------------- hours */}
            <div className="min-w-0">
              <h2 className="label text-[#8A5F18]">Hours</h2>
              <dl className="mt-5">
                {FARM.hours.map((h) => (
                  <div
                    key={h.days.join()}
                    className="flex justify-between gap-6 border-b border-[#2A2118]/15 py-3"
                  >
                    <dt className="text-[#2A2118]">{h.days.join(" & ")}</dt>
                    <dd className="tabular-nums text-[#4A3B29]">
                      {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm text-[#4A3B29]">
                Open {FARM.openSeason.from} through {FARM.openSeason.to}. We
                close for the winter once the last of the squash is sold.
              </p>

              <h2 className="label mt-12 text-[#8A5F18]">Get in touch</h2>
              {real ? (
                <div className="mt-5 space-y-3">
                  <a
                    href={`tel:${FARM.phone}`}
                    className="block text-lg text-[#2A2118] underline decoration-[#8A5F18] underline-offset-4"
                  >
                    {formattedPhone()}
                  </a>
                  <a
                    href={`mailto:${FARM.email}`}
                    className="block text-[#4A3B29] underline decoration-[#8A5F18] underline-offset-4"
                  >
                    {FARM.email}
                  </a>
                  <p className="text-sm text-[#4A3B29]">
                    Calling is faster than emailing. We are usually in the field
                    and the phone is in a pocket.
                  </p>
                </div>
              ) : (
                <div className="mt-5 border border-[#8A5F18]/40 bg-[#8A5F18]/8 p-5">
                  <p className="text-sm text-[#4A3B29]">
                    The phone number and address have not been published yet.
                    They are set in one file — <code>src/lib/farm.ts</code> —
                    and this block turns into a real tap-to-call link and a map
                    the moment they are filled in.
                  </p>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------ map */}
            <div className="min-w-0">
              <h2 className="label text-[#8A5F18]">Where</h2>
              {real ? (
                <>
                  <address className="mt-5 text-lg not-italic text-[#2A2118]">
                    {FARM.address.street}
                    <br />
                    {FARM.address.locality}, {FARM.address.region}{" "}
                    {FARM.address.postalCode}
                  </address>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block border border-[#8A5F18] px-5 py-3 text-sm tracking-wide text-[#2A2118] uppercase transition-colors hover:bg-[#2A2118] hover:text-parchment"
                  >
                    Open in maps
                  </a>
                  {/* Lazy and below the address on purpose: the text is the
                      answer, the map is the convenience. */}
                  <iframe
                    title={`Map to ${FARM.name}`}
                    loading="lazy"
                    className="mt-6 aspect-[4/3] w-full max-w-full border border-[#2A2118]/20"
                    src={`https://maps.google.com/maps?q=${FARM.geo.lat},${FARM.geo.lng}&z=13&output=embed`}
                  />
                </>
              ) : (
                <div className="mt-5 flex aspect-[4/3] w-full items-center justify-center border border-dashed border-[#8A5F18]/50 p-6 text-center">
                  <p className="text-sm text-[#4A3B29]">
                    The map appears here once the farm&rsquo;s address and
                    coordinates are set. Nothing is shown in the meantime rather
                    than a pin on the wrong road.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- ready recap -- */}
      <section className={`${SHELL} py-16 md:py-24`}>
        <h2 className="display text-2xl md:text-4xl">
          {ready.length > 0
            ? "On the table today"
            : "Nothing on the table today"}
        </h2>
        {ready.length > 0 ? (
          <ul className="mt-8 flex list-none flex-wrap gap-x-6 gap-y-3 p-0">
            {ready.map((c) => (
              <li key={c.id} className="text-parchment/85">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="prose-farm mt-6">
            We are out of season. Asparagus is first back, usually the first week
            of May.
          </p>
        )}
        <Link
          href="/#ready"
          className="label mt-10 inline-block text-gold transition-colors hover:text-gold-lit"
        >
          See the whole season &rarr;
        </Link>
      </section>
    </>
  );
}
