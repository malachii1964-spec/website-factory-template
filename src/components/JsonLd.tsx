import { site, addressOneLine, hours } from "@/lib/site";

/** LocalBusiness structured data so Mike shows up richly in Google/Maps. */
export function LocalBusinessJsonLd() {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const openingHours = Object.entries(hours)
    .filter(([, h]) => h)
    .map(([day, h]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${dayNames[Number(day)]}`,
      opens: h!.open,
      closes: h!.close,
    }));

  const data = {
    "@context": "https://schema.org",
    "@type": ["GardenStore", "LocalBusiness"],
    name: site.legalName,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    },
    openingHoursSpecification: openingHours,
    areaServed: "Chautauqua County, NY",
    slogan: site.tagline,
    knowsAbout: ["Plant nursery", "Hydroponics", "Grower supplies", "Landscaping plants"],
    // Human-readable address string for crawlers that skip structured fields.
    "@id": site.url,
    branchOf: undefined,
    disambiguatingDescription: addressOneLine,
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline here (no user input).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
