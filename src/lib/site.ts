/**
 * Single source of truth for Mike's Nursery business info (NAP), hours, and
 * social/meta. Verified facts from public listings (Yelp/Google, July 2026).
 * TODO(mike): confirm exact hours, email, and any seasonal hour changes.
 */

export const site = {
  name: "Mike's Nursery",
  legalName: "Mike's Nursery & Hydroponics",
  tagline: "Grown with care in Western New York",
  description:
    "The region's largest plant nursery and grower-supply shop — three greenhouses of flowers, trees, shrubs, and vegetable starts, plus a full hydroponics and indoor-growing department.",
  url: "https://mikesnursery.com",
  phone: "(716) 763-1612",
  phoneHref: "tel:+17167631612",
  email: "hello@mikesnursery.com", // TODO(mike): confirm real inbox
  address: {
    street: "199 E Fairmount Ave",
    city: "Lakewood",
    region: "NY",
    postalCode: "14750",
    country: "US",
  },
  geo: { lat: 42.0989, lng: -79.3336 }, // approximate; refine with real pin
  mapsQuery: "Mike's Nursery, 199 E Fairmount Ave, Lakewood, NY 14750",
  founded: 1987, // TODO(mike): confirm founding year for the About story
  greenhouses: 3,
} as const;

export const addressOneLine = `${site.address.street}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

/**
 * Opening hours, 0=Sunday .. 6=Saturday, in 24h local time.
 * open === null means closed that day.
 */
export type DayHours = { open: string; close: string } | null;

export const hours: Record<number, DayHours> = {
  0: { open: "09:00", close: "17:00" }, // Sun
  1: { open: "09:00", close: "19:00" }, // Mon
  2: { open: "09:00", close: "19:00" }, // Tue
  3: { open: "09:00", close: "19:00" }, // Wed
  4: { open: "09:00", close: "19:00" }, // Thu
  5: { open: "09:00", close: "19:00" }, // Fri
  6: { open: "09:00", close: "18:00" }, // Sat
};

export const nav = [
  { href: "/plants", label: "Plants" },
  { href: "/hydroponics", label: "Hydroponics" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Visit" },
] as const;
