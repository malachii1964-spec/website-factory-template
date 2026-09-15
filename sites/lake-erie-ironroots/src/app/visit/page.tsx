import type { Metadata } from "next";
import Link from "next/link";
import { FarmJsonLd } from "@/components/json-ld";
import { RootTrunk } from "@/components/root";
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

const SHELL = "mx-auto w-full max-w-6xl pr-5 pl-9 md:pr-8 md:pl-28";

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
        {/* The root continues through the daylight band. */}
        <div className="pointer-events-none absolute inset-y-0 inset-x-0">
          <div className="relative mx-auto h-full w-full max-w-6xl">
            <RootTrunk tone="light" />
          </div>
        </div>
        <div className={`${SHELL} py-16 md:py-24`}>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {/* ---------------------------------------------------- hours */}
            <div className="min-w-0">
              <h3 className="label text-[#8A5F18]">Hours</h3>
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

              <h3 className="label mt-12 text-[#8A5F18]">Get in touch</h3>
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
                /*
                  One line of customer-facing copy, in a normal paragraph.

                  What used to be here was a tinted box telling a farm customer
                  that the number "is set in one file — src/lib/farm.ts". That
                  is the build narrating its own scaffolding to a stranger
                  looking for a phone number, on the one page whose job is
                  "how do I reach you". Nothing rendered may ever name a source
                  path.
                */
                <p className="mt-5 text-[#4A3B29]">
                  The phone number goes up here before opening day.
                </p>
              )}
            </div>

            {/* ------------------------------------------------------ map */}
            <div className="min-w-0">
              <h3 className="label text-[#8A5F18]">Where</h3>
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
                /*
                  No dashed rectangle reserving space for a map. A dashed box
                  with centred grey text explaining that content will exist
                  later is the most recognisable generated-UI shape there is,
                  and it made the top of this page two placeholders side by
                  side. One honest line instead.
                */
                <p className="mt-5 text-lg text-[#2A2118]">
                  {FARM.address.locality} area, {FARM.county}. The exact address
                  goes up before opening day.
                </p>
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
