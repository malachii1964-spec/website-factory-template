import {
  FARM,
  hasRealAddress,
  hasRealEmail,
  hasRealPhone,
} from "@/lib/farm";

/** Local-date ISO day, so a build machine east of UTC cannot shift it. */
function isoDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * LocalBusiness structured data. This is what puts the hours, the phone number
 * and the pin on a Google result for "farm stand near me" — for a farm that
 * lives on local search, it is not decoration.
 *
 * Dual-typed Farm + LocalBusiness: Google's local rich results key off
 * LocalBusiness and its subtypes, and Farm is not one of them, so a Farm-only
 * graph may never produce the result this exists for. Claiming both costs
 * nothing and removes the doubt.
 *
 * Every placeholder field is omitted rather than published. Structured data is
 * a machine-readable assertion to a search engine; emitting "0000 Route 20"
 * and a real lat/long near Westfield would be publishing a fictitious business
 * location, and it would outlive the placeholder in Google's index.
 *
 * The opening hours are generated from the same FARM.hours the footer renders,
 * so the machine-readable hours and the visible hours cannot drift apart.
 */
export function FarmJsonLd() {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Farm", "LocalBusiness"],
    name: FARM.name,
    description:
      "Organic fruit and vegetable farm on the Lake Erie plain in Chautauqua County, New York.",
    slogan: FARM.tagline,
    foundingDate: isoDay(FARM.established),
    areaServed: `${FARM.county}, ${FARM.state}`,
    openingHoursSpecification: FARM.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...h.days],
      opens: h.opens,
      closes: h.closes,
    })),
  };

  if (hasRealPhone()) data.telephone = FARM.phone;
  if (hasRealEmail()) data.email = FARM.email;
  if (hasRealAddress()) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: FARM.address.street,
      addressLocality: FARM.address.locality,
      addressRegion: FARM.address.region,
      postalCode: FARM.address.postalCode,
      addressCountry: FARM.address.country,
    };
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: FARM.geo.lat,
      longitude: FARM.geo.lng,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Escaping "<" is what prevents a "</script>" breakout; every value here
      // is a compile-time constant, but the escape stays because that will not
      // always be true.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
