import { business, hours } from "@/lib/business";

const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function LocalBusinessJsonLd() {
  const openingHours = (hours.daysOpen as readonly number[])
    .map((d) => DAY_CODES[d])
    .join(",");
  const openTime = `${String(hours.open.hour).padStart(2, "0")}:${String(hours.open.minute).padStart(2, "0")}`;
  const closeTime = `${String(hours.close.hour).padStart(2, "0")}:${String(hours.close.minute).padStart(2, "0")}`;

  const data = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: business.name,
    telephone: business.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.coordinates.lat,
      longitude: business.coordinates.lng,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: openingHours.split(",").map((code) => {
        const map: Record<string, string> = {
          Su: "Sunday", Mo: "Monday", Tu: "Tuesday", We: "Wednesday",
          Th: "Thursday", Fr: "Friday", Sa: "Saturday",
        };
        return map[code];
      }),
      opens: openTime,
      closes: closeTime,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
