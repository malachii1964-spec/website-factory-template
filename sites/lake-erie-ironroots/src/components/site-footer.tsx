import Link from "next/link";
import { Compass } from "@/components/ornament";
import {
  FARM,
  formatDays,
  formattedPhone,
  hasRealAddress,
  hasRealEmail,
  hasRealPhone,
} from "@/lib/farm";

/** "08:00" → "8am", "13:00" → "1pm", "09:30" → "9:30am". */
export function humanTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/**
 * The colophon.
 *
 * Each fact publishes only once it is true. These were gated behind one
 * combined flag, so the day the owner supplied a real street address the block
 * still showed nothing because the phone number was not in yet.
 */
export function Colophon() {
  const address = hasRealAddress();
  const phone = hasRealPhone();
  const email = hasRealEmail();

  return (
    <footer className="relative z-20 border-t rule-hair bg-void">
      <div className="sheet py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-3 md:gap-16">
          <div>
            <h2 className="cut text-gold">Hours</h2>
            <dl className="mt-5">
              {FARM.hours.map((h) => (
                <div
                  key={h.days.join()}
                  className="flex justify-between gap-6 border-b rule-hair py-3"
                >
                  <dt className="text-gild">{formatDays(h.days)}</dt>
                  <dd className="cut text-brass">
                    {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-brass">
              {FARM.yearRound
                ? "Open all year. The bench runs through the winter."
                : "Seasonal hours."}
            </p>
          </div>

          <div>
            <h2 className="cut text-gold">Where</h2>
            {address ? (
              <address className="mt-5 not-italic text-gild">
                {FARM.address.street}
                <br />
                {FARM.address.locality}, {FARM.address.region}{" "}
                {FARM.address.postalCode}
              </address>
            ) : (
              <p className="mt-5 text-brass">
                {FARM.address.locality}, {FARM.county}.
              </p>
            )}
          </div>

          <div>
            <h2 className="cut text-gold">Reach us</h2>
            <div className="mt-5 space-y-2">
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
              {!phone && !email && (
                <p className="text-brass">Details go up before opening day.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t rule-hair pt-8">
          <p className="cut flex items-center gap-4 text-stone">
            <span>{FARM.wordmark}</span>
            <span className="text-gold/60">
              <Compass size={16} />
            </span>
            <span>{FARM.establishedYear}</span>
          </p>
          <p className="cut text-stone">
            {FARM.county}, {FARM.state} &middot;{" "}
            <Link href="/sign" className="link">
              Today&rsquo;s sheet
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
