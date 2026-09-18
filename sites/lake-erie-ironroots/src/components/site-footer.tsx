import Link from "next/link";
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
 * The colophon — where a printed sheet says who made it and how to reach them.
 *
 * Each fact is published only once it is true. These were gated behind one
 * combined flag, so the day the owner supplied a real street address the block
 * still showed nothing because the phone number was not in yet.
 */
export function Colophon() {
  const address = hasRealAddress();
  const phone = hasRealPhone();
  const email = hasRealEmail();

  return (
    <footer className="sheet band-close rule-section">
      <div className="grid gap-10 pt-10 md:grid-cols-3 md:gap-14">
        <div>
          <h2 className="fig text-ink">Hours</h2>
          <dl className="mt-3">
            {FARM.hours.map((h) => (
              <div key={h.days.join()} className="flex justify-between gap-6 py-1">
                <dt className="text-ink-2">{formatDays(h.days)}</dt>
                <dd className="fig text-ink">
                  {humanTime(h.opens)} &ndash; {humanTime(h.closes)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-2">
            {FARM.yearRound
              ? "Open all year. The bench runs through the winter."
              : "Seasonal hours."}
          </p>
        </div>

        <div>
          <h2 className="fig text-ink">Where</h2>
          {address ? (
            <address className="mt-3 not-italic text-ink-2">
              {FARM.address.street}
              <br />
              {FARM.address.locality}, {FARM.address.region} {FARM.address.postalCode}
            </address>
          ) : (
            <p className="mt-3 text-ink-2">
              {FARM.address.locality}, {FARM.county}.
            </p>
          )}
        </div>

        <div>
          <h2 className="fig text-ink">Reach us</h2>
          <div className="mt-3 space-y-1">
            {phone && (
              <a href={`tel:${FARM.phone}`} className="link block">
                {formattedPhone()}
              </a>
            )}
            {email && (
              <a href={`mailto:${FARM.email}`} className="link block">
                {FARM.email}
              </a>
            )}
            {!phone && !email && (
              <p className="text-ink-2">Details go up before opening day.</p>
            )}
          </div>
        </div>
      </div>

      <p className="fig mt-12 text-ink-2">
        {FARM.name} &middot; {FARM.county}, {FARM.state} &middot;{" "}
        <Link href="/sign" className="link">
          Print today&rsquo;s sheet
        </Link>
      </p>
    </footer>
  );
}
