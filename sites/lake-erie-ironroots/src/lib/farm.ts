/**
 * Lake Erie IronRoots — the facts about the farm, in one place.
 *
 * Everything a human needs to correct lives in this file and nowhere else. If
 * a phone number, an address or an opening day is wrong, it is wrong here once
 * rather than in nine components.
 *
 * Entries marked NEEDS OWNER are placeholders chosen to be plausible for a
 * Chautauqua County farm. They are structurally correct so the site is
 * complete and testable, but they are NOT the owner's real details and must be
 * replaced before the site goes near a customer.
 */

export const FARM = {
  name: "Lake Erie IronRoots",
  /** Small letterspaced line above the wordmark, as in the brand artwork. */
  overline: "Lake Erie",
  wordmark: "IronRoots",
  tagline: "Built on purpose. Rooted in strength.",

  /**
   * The owner stated 1 September 2026. The brand artwork reads "ESTD 2024".
   * One of the two is wrong; this constant follows what the owner said, and
   * the conflict is flagged in docs/design-plan.md rather than guessed at.
   */
  established: new Date(2026, 8, 1),

  county: "Chautauqua County",
  state: "New York",

  // ---------------------------------------------------------- NEEDS OWNER --
  address: {
    street: "0000 Route 20", // NEEDS OWNER
    locality: "Westfield", // NEEDS OWNER
    region: "NY",
    postalCode: "14787", // NEEDS OWNER
    country: "US",
  },
  /** NEEDS OWNER. Used for tap-to-call, so it must be dialable. */
  phone: "+1-716-000-0000",
  /** NEEDS OWNER. Where the contact form delivers. */
  email: "hello@lakeerieironroots.com",
  /** NEEDS OWNER. Exact latitude/longitude of the farm stand for the map. */
  geo: { lat: 42.3223, lng: -79.5784 },

  /**
   * Farm-stand hours. NEEDS OWNER — these are a normal seasonal-stand pattern,
   * not the real ones. `days` uses schema.org day names so the JSON-LD and the
   * visible hours table can never drift apart.
   */
  hours: [
    { days: ["Thursday", "Friday"], opens: "10:00", closes: "18:00" },
    { days: ["Saturday"], opens: "09:00", closes: "17:00" },
    { days: ["Sunday"], opens: "10:00", closes: "15:00" },
  ],
  /** Months the stand is open at all. NEEDS OWNER. */
  openSeason: { from: "May", to: "November" },
} as const;

/** The five pillars, taken verbatim from the brand artwork. */
export const PILLARS = [
  {
    id: "purpose",
    title: "Built on Purpose",
    body: "Every bed on this place was planned before it was planted. We grow what grows well here — on the lake plain, in Chautauqua gravelly loam — and we leave the rest to farms better suited to it.",
  },
  {
    id: "strength",
    title: "Rooted in Strength",
    body: "Soil first. We feed the ground with compost and cover crops and let the root system do the work, because a plant that can find its own water and minerals does not need rescuing later.",
  },
  {
    id: "integrity",
    title: "Guided by Integrity",
    body: "No synthetic pesticides, no synthetic fertilizers, and no vague words about it. Ask us what went on any bed in any week and we will tell you exactly.",
  },
  {
    id: "nature",
    title: "Inspired by Nature",
    body: "The lake sets our calendar. It holds spring back past the killing frosts and holds autumn open weeks longer than inland ground. We plant to that, not to a catalogue.",
  },
  {
    id: "legacy",
    title: "Cultivating Legacy",
    // Deliberately no number in this sentence. It used to say "eleven days
    // into our turn", which was wrong the day after it was written and gets
    // wronger every morning with nothing to catch it.
    body: "This is the oldest farmed ground of its kind in the country, and our turn with it has barely started. We intend to hand it on better than we found it.",
  },
] as const;

/**
 * The soil under the farm, in Munsell notation, from the published Chautauqua
 * soil series. Used for the horizon band and the depth labels — the colors are
 * the real ones, not chosen for looks.
 */
export const SOIL_HORIZONS = [
  { id: "O", label: "Leaf litter and root mat", from: 0, to: 2, hex: "#2A2118" },
  { id: "A", label: "Dark topsoil, worked", from: 2, to: 9, hex: "#3E3222" },
  { id: "B", label: "Gravelly silt loam", from: 9, to: 28, hex: "#6E5232" },
  { id: "C", label: "Glacial till over shale", from: 28, to: 60, hex: "#8A7350" },
] as const;

/**
 * False while the NEEDS OWNER placeholders are still in place.
 *
 * A map pin on the wrong road is worse than no map, and a tel: link to
 * 716-000-0000 is worse than no phone number. The UI checks this and renders a
 * designed "not published yet" state instead of confidently lying.
 *
 * This is checked by the header, the footer and the JSON-LD as well as the
 * Visit page. It was originally only honoured on /visit, which meant the
 * placeholder street, phone and email still shipped in the chrome of every
 * page and — worse — went out as indexable structured data asserting a
 * business at an address the owner does not occupy.
 */
export function hasRealContactDetails(): boolean {
  return hasRealAddress() && hasRealPhone() && hasRealEmail();
}

export function hasRealAddress(): boolean {
  return !FARM.address.street.startsWith("0000");
}

export function hasRealPhone(): boolean {
  return !FARM.phone.replace(/\D/g, "").endsWith("0000000");
}

export function hasRealEmail(): boolean {
  return !FARM.email.startsWith("hello@lakeerieironroots.com");
}

export function formattedPhone(): string {
  const digits = FARM.phone.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return FARM.phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function establishedLine(): string {
  return `Established ${FARM.established.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}
