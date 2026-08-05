import type { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { business, hours, hoursDisplay, seasonDisplay } from "@/lib/business";
import { OpenNowBadge } from "@/components/site/open-now-badge";
import { getStandStatus } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Visit Us",
  description: `Directions, hours, and contact info for Timmerman's Farm and Market at ${business.addressLine}.`,
};

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function VisitPage() {
  const status = getStandStatus(new Date());
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(business.mapsQuery)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.mapsQuery)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="marker-tag text-xl text-barn">visit us</p>
      <h1 className="mt-1 font-display text-4xl font-semibold italic text-espresso sm:text-5xl">
        Right on Route 20
      </h1>
      <OpenNowBadge status={status} className="mt-5" />

      <div className="mt-10 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="rounded-lg border border-cream-line bg-paper-deep p-6">
            <p className="flex items-start gap-3 text-espresso">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-barn-deep" aria-hidden="true" />
              <span>
                {business.address.street}
                <br />
                {business.address.city}, {business.address.state} {business.address.zip}
              </span>
            </p>
            <a
              href={business.phoneHref}
              className="mt-3 flex items-center gap-3 text-espresso hover:text-barn-deep"
            >
              <Phone className="h-5 w-5 shrink-0 text-barn-deep" aria-hidden="true" />
              {business.phone}
            </a>

            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-barn px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-barn-deep"
            >
              Get Directions
            </a>
          </div>

          <div className="mt-6 rounded-lg border border-cream-line p-6">
            <h2 className="font-display text-xl font-semibold text-espresso">Hours</h2>
            <p className="mt-1 text-sm text-espresso-soft">{seasonDisplay}</p>
            <table className="mt-4 w-full text-sm">
              <caption className="sr-only">Weekly hours, {seasonDisplay}</caption>
              <tbody>
                {DAY_LABELS.map((day) => (
                  <tr key={day} className="border-t border-cream-line first:border-t-0">
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-espresso">
                      {day}
                    </th>
                    <td className="py-2 text-espresso-soft">{hoursDisplay.split(",")[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-espresso-soft/70">
              Closed outside of season ({seasonDisplay}). Hours can shift
              with the weather — call {business.phone}{" "}
              if you&rsquo;re driving a distance.
            </p>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-cream-line sm:aspect-[16/10]">
            <iframe
              title="Map showing the location of Timmerman's Farm and Market"
              src={mapSrc}
              loading="lazy"
              className="h-full w-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-barn-deep hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      <p className="sr-only">
        Open {hours.daysOpen.length} days a week, {hoursDisplay}, {seasonDisplay}.
      </p>
    </div>
  );
}
