import { FARM } from "@/lib/farm";

/**
 * LocalBusiness structured data. This is what puts the hours, the phone number
 * and the pin on a Google result for "farm stand near me" — for a farm that
 * lives on local search, it is not decoration.
 *
 * The opening hours are generated from the same FARM.hours the footer renders,
 * so the machine-readable hours and the visible hours cannot drift apart.
 */
export function FarmJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Farm",
    name: FARM.name,
    description:
      "Organic fruit and vegetable farm on the Lake Erie plain in Chautauqua County, New York.",
    slogan: FARM.tagline,
    foundingDate: FARM.established.toISOString().slice(0, 10),
    telephone: FARM.phone,
    email: FARM.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: FARM.address.street,
      addressLocality: FARM.address.locality,
      addressRegion: FARM.address.region,
      postalCode: FARM.address.postalCode,
      addressCountry: FARM.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: FARM.geo.lat,
      longitude: FARM.geo.lng,
    },
    openingHoursSpecification: FARM.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...h.days],
      opens: h.opens,
      closes: h.closes,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Serialising with JSON.stringify and escaping "<" is the documented way
      // to inline JSON-LD without opening an injection hole.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
