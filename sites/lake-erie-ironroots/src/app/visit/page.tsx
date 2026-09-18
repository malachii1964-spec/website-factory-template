import type { Metadata } from "next";
import Link from "next/link";
import { FarmJsonLd } from "@/components/json-ld";
import { humanTime } from "@/components/site-footer";
import { farmToday } from "@/lib/clock";
import { cuttingOn, roomNotRunning } from "@/lib/crops";
import {
  FARM,
  formatDays,
  formattedPhone,
  fullAddress,
  hasRealAddress,
  hasRealEmail,
  hasRealPhone,
} from "@/lib/farm";
import { frostLine } from "@/lib/season";

// See the note on src/app/page.tsx — same five-minute window, same reasoning.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Visit",
  description: `Hours, directions and how to reach ${FARM.name} in ${FARM.address.locality}, ${FARM.state}.`,
};

export default function VisitPage() {
  const today = farmToday();
  const cutting = cuttingOn(today);
  const building = roomNotRunning();
  /*
    Per-field, not all-or-nothing. These were gated on one combined flag, so the
    day the owner supplied a real street address the map still stayed hidden
    because the phone number was not in yet.
  */
  const address = hasRealAddress();
  const phone = hasRealPhone();
  const email = hasRealEmail();
  const mapQuery = encodeURIComponent(fullAddress());

  return (
    <>
      <FarmJsonLd />

      <section className="sheet band-record">
        <p className="fig text-ink-2">Visit</p>
        <h1 className="display mt-4 max-w-[18ch] text-4xl text-ink md:text-6xl">
          Come to the farm.
        </h1>
        <p className="prose-farm mt-5 text-lg">
          Everything is grown here and sold here. There is no warehouse and no
          second location — what is on the table is what came off the bench or
          out of the ground.
        </p>
      </section>

      <section className="sheet rule-section">
        <div className="grid gap-12 pt-10 md:grid-cols-2 md:gap-16">
          {/* ------------------------------------------------------ hours -- */}
          <div className="min-w-0">
            <h2 className="display text-2xl text-ink">Hours</h2>
            <dl className="mt-4">
              {FARM.hours.map((h) => (
                <div key={h.days.join()} className="rule-row flex justify-between gap-6 py-3">
                  <dt className="text-ink">{formatDays(h.days)}</dt>
                  <dd className="fig text-ink-2">
                    {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-ink-2">
              {FARM.yearRound
                ? "Open all year. The indoor bench runs through the winter, so there is no closed season."
                : "Seasonal hours."}
            </p>

            <h2 className="display mt-14 text-2xl text-ink">Reach us</h2>
            {phone || email ? (
              <div className="mt-4 space-y-2">
                {phone && (
                  <a href={`tel:${FARM.phone}`} className="link block text-lg">
                    {formattedPhone()}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${FARM.email}`} className="link block">
                    {FARM.email}
                  </a>
                )}
                <p className="text-sm text-ink-2">
                  Calling is faster than emailing. We are usually in the room and
                  the phone is in a pocket.
                </p>
              </div>
            ) : (
              /*
                One line of customer-facing copy, in an ordinary paragraph. What
                used to be here was a tinted box telling a farm customer that the
                number "is set in one file — src/lib/farm.ts". Nothing rendered
                may ever name a source path.
              */
              <p className="mt-4 text-ink-2">
                The phone number goes up here before opening day.
              </p>
            )}
          </div>

          {/* -------------------------------------------------------- where */}
          <div className="min-w-0">
            <h2 className="display text-2xl text-ink">Where</h2>
            {address ? (
              <>
                <address className="mt-4 text-lg not-italic text-ink">
                  {FARM.address.street}
                  <br />
                  {FARM.address.locality}, {FARM.address.region}{" "}
                  {FARM.address.postalCode}
                </address>
                <p className="mt-5">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    Open in maps
                  </a>
                </p>
                <p className="mt-6 max-w-[34ch] text-sm text-ink-2">
                  North Portage runs south off Main Street in {FARM.address.locality}.
                </p>
              </>
            ) : (
              /*
                No dashed rectangle reserving space for a map. A dashed box with
                centred grey text explaining that content will exist later is the
                most recognisable generated-UI shape there is.
              */
              <p className="mt-4 text-lg text-ink">
                {FARM.address.locality} area, {FARM.county}. The exact address
                goes up before opening day.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- what is on -- */}
      <section className="sheet band-note rule-section">
        <h2 className="display text-3xl text-ink md:text-4xl">
          {building
            ? "Nothing is cutting yet."
            : cutting.length > 0
              ? "On the table today"
              : "Nothing is cutting today."}
        </h2>
        {cutting.length > 0 ? (
          <ul className="mt-6 flex list-none flex-wrap gap-x-8 gap-y-2 p-0">
            {cutting.map((c) => (
              <li key={c.id} className="display text-2xl text-iron">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="prose-farm mt-5">
            {building
              ? "The room is still being built. The register shows what is going in and how often it will be cut."
              : "Call before driving out — what is cuttable changes week to week."}
          </p>
        )}
        <p className="fig mt-8 text-ink-2">Outdoors &middot; {frostLine(today)}</p>
        <p className="mt-8">
          <Link href="/" className="link text-lg">
            Read the whole register
          </Link>
        </p>
      </section>
    </>
  );
}
