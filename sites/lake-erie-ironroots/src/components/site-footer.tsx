import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import {
  establishedLine,
  FARM,
  formattedPhone,
  hasRealAddress,
  hasRealEmail,
  hasRealPhone,
} from "@/lib/farm";

function joinDays(days: readonly string[]): string {
  if (days.length === 1) return days[0];
  return `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`;
}

/** 24h "14:00" to "2pm" — the way hours are actually written on a sign. */
export function humanTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function SiteFooter() {
  const address = hasRealAddress();
  const phone = hasRealPhone();
  const email = hasRealEmail();

  return (
    <footer className="relative z-40 mt-24 border-t border-[var(--hairline)] bg-shale">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <Wordmark />
          <p className="display mt-4 text-lg text-parchment/80">{FARM.tagline}</p>
          <p className="label mt-4 text-iron">{establishedLine()}</p>
        </div>

        <div>
          <h2 className="label">The stand</h2>
          <dl className="mt-4 space-y-1 text-sm">
            {FARM.hours.map((h) => (
              <div key={h.days.join()} className="flex justify-between gap-6">
                <dt className="text-parchment/85">{joinDays(h.days)}</dt>
                <dd className="tabular-nums text-iron">
                  {humanTime(h.opens)} – {humanTime(h.closes)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-iron">
            Open {FARM.openSeason.from} through {FARM.openSeason.to}. Closed once
            the ground freezes.
          </p>
        </div>

        <div>
          <h2 className="label">Find us</h2>
          {/* Nothing here is published until it is real. A placeholder street
              and a dead tel: link in the chrome of every page is worse than a
              line telling the truth. */}
          {address || phone || email ? (
            <address className="mt-4 space-y-2 text-sm not-italic text-parchment/85">
              {address && (
                <p>
                  {FARM.address.street}
                  <br />
                  {FARM.address.locality}, {FARM.address.region}{" "}
                  {FARM.address.postalCode}
                </p>
              )}
              {phone && (
                <p>
                  <a
                    className="text-gold transition-colors hover:text-gold-lit"
                    href={`tel:${FARM.phone}`}
                  >
                    {formattedPhone()}
                  </a>
                </p>
              )}
              {email && (
                <p>
                  <a
                    className="text-gold transition-colors hover:text-gold-lit"
                    href={`mailto:${FARM.email}`}
                  >
                    {FARM.email}
                  </a>
                </p>
              )}
            </address>
          ) : (
            <p className="mt-4 text-sm text-iron">
              {FARM.county}, {FARM.state}. The stand&rsquo;s address and phone
              number go up here before opening day.
            </p>
          )}
          <Link
            href="/visit"
            className="label mt-5 inline-block text-gold transition-colors hover:text-gold-lit"
          >
            Visit the stand &rarr;
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-iron md:px-8">
          <p>
            © {new Date().getFullYear()} {FARM.name} · {FARM.county},{" "}
            {FARM.state}
          </p>
          <p className="label text-iron">Rooted in strength</p>
        </div>
      </div>
    </footer>
  );
}
