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
   * The year, not a date.
   *
   * The owner first said 1 September 2026, which contradicted the "ESTD 2024"
   * on the brand artwork; asked which was right, they confirmed 2024. Only the
   * year is known, so only the year is stored — a made-up founding DAY would
   * have gone straight into the page and into the structured data, and nobody
   * would ever have noticed it was invented.
   */
  establishedYear: 2024,

  county: "Chautauqua County",
  state: "New York",

  /** Confirmed by the owner. */
  address: {
    street: "154 North Portage St",
    locality: "Westfield",
    region: "NY",
    postalCode: "14787",
    country: "US",
  },
  /** Confirmed by the owner. E.164 so tel: links dial correctly anywhere. */
  phone: "+1-716-753-0404",
  /**
   * Confirmed by the owner.
   *
   * Worth knowing: this is a personal inbox and it is now on a public page,
   * where address-harvesting bots will find it. That is a normal trade for a
   * small farm and it is the owner's call. If the spam ever gets tiresome, a
   * forwarding address on the domain (stand@lakeerieironroots.com) can be
   * swapped in here and nothing else has to change.
   */
  email: "malachii1964@gmail.com",
  /**
   * Coordinates are deliberately absent.
   *
   * The map and the structured data are driven by the street address instead,
   * which Google geocodes itself. Typing in an approximate lat/long for a real
   * street address is exactly the "pin on a stranger's driveway" this file
   * exists to prevent, and a wrong pin looks authoritative in a way a missing
   * one does not. Set this only from a reading taken AT the stand.
   */
  geo: null as { lat: number; lng: number } | null,

  /**
   * Confirmed by the owner: Monday to Friday 8-5, Saturday 9-1, closed Sunday.
   * `days` uses schema.org day names so the JSON-LD and the visible hours
   * table can never drift apart.
   */
  hours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
    { days: ["Saturday"], opens: "09:00", closes: "13:00" },
  ],
  /**
   * Confirmed by the owner 2026-09-17: indoors and outdoors, all year round.
   *
   * This was "May through November", which was inferred from a roadside-stand
   * model that turned out to be the wrong business. It contradicted the hours
   * the owner had already given — Monday to Friday 8–5 and Saturday 9–1 is a
   * workshop schedule, not a seasonal one — and it was printed on every page.
   */
  yearRound: true,
} as const;

/**
 * The five pillars. The titles are verbatim from the owner's brand artwork; the
 * bodies are written here.
 *
 * Rewritten 2026-09-17, when the owner confirmed the farm runs indoors and
 * outdoors all year. The previous bodies described a seasonal field operation —
 * "every bed was planned before it was planted", "the lake sets our calendar" —
 * which is now only half the business. One of them also claimed this was "the
 * oldest farmed ground of its kind in the country", a superlative nobody
 * supplied and nothing supports. It is gone rather than softened.
 */
export const PILLARS = [
  {
    id: "purpose",
    title: "Built on Purpose",
    body: "Nothing here is grown because it fills a shelf. Each crop is chosen for the place it goes — the bench under lights or the ground outside — and anything that would only ever be mediocre in both is left to a farm better suited to it.",
  },
  {
    id: "strength",
    title: "Rooted in Strength",
    body: "Soil first, indoors and out. We feed the ground rather than the plant and let the root system do the work, because a root that can find its own water and minerals does not need rescuing later.",
  },
  {
    id: "integrity",
    title: "Guided by Integrity",
    body: "No synthetic pesticides, no synthetic fertilizers, and no vague words about it. Ask what went into any bed or any pot in any week and you will get the actual answer.",
  },
  {
    id: "nature",
    title: "Inspired by Nature",
    body: "Outside, the lake sets the calendar — it holds spring back past the killing frosts and holds autumn open weeks longer than inland ground. Inside, we are not escaping that so much as extending it, on the same soil biology, through the winter.",
  },
  {
    id: "legacy",
    title: "Cultivating Legacy",
    // Deliberately no number in this sentence. It used to say "eleven days
    // into our turn", which was wrong the day after it was written and gets
    // wronger every morning with nothing to catch it.
    body: "Our turn with this ground has barely started. We intend to hand it on better than we found it.",
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

/*
  The guards are written as pure predicates over a value, with thin
  FARM-bound wrappers. They decide what this site asserts about a real
  business to customers and to Google, so they are worth being able to test
  against a placeholder AND a real value — which is impossible when they only
  ever read one module constant.
*/
export function isRealStreet(street: string): boolean {
  return street.trim().length > 0 && !/^0{3,}\b/.test(street.trim());
}

export function isRealPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "").replace(/^1/, "");
  // A real US number is ten digits and its last seven are not all zero.
  return digits.length === 10 && !/^0{7}$/.test(digits.slice(3));
}

export function isRealEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) &&
    email !== "hello@lakeerieironroots.com";
}

export function hasRealAddress(): boolean {
  return isRealStreet(FARM.address.street);
}

/** The single-line address, for map queries and "open in maps" links. */
export function fullAddress(): string {
  const a = FARM.address;
  return `${a.street}, ${a.locality}, ${a.region} ${a.postalCode}`;
}

export function hasRealPhone(): boolean {
  return isRealPhone(FARM.phone);
}

export function hasRealEmail(): boolean {
  return isRealEmail(FARM.email);
}

export function formattedPhone(): string {
  const digits = FARM.phone.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return FARM.phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/* ------------------------------------------------------ opening hours --- */

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Print a set of days the way a person writes them on a sign.
 *
 * Three components each had their own version of this — `join(" & ")` in two
 * places and a comma-list in the third — which was fine while the farm opened
 * two or three days and became "Monday & Tuesday & Wednesday & Thursday &
 * Friday" the moment it opened five. One formatter, used everywhere.
 *
 * Runs of consecutive days collapse to a range; anything else stays a list.
 */
export function formatDays(days: readonly string[]): string {
  const idx = days
    .map((d) => DAY_ORDER.indexOf(d as (typeof DAY_ORDER)[number]))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (idx.length === 0) return "";

  const runs: number[][] = [];
  for (const i of idx) {
    const last = runs[runs.length - 1];
    if (last && i === last[last.length - 1] + 1) last.push(i);
    else runs.push([i]);
  }

  const parts = runs.map((run) =>
    // A run of two is "Monday & Tuesday", not "Monday–Tuesday": a range
    // reads oddly when it spans a single gap.
    run.length >= 3
      ? `${DAY_ORDER[run[0]]}–${DAY_ORDER[run[run.length - 1]]}`
      : run.map((i) => DAY_ORDER[i]).join(" & "),
  );
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} & ${parts[parts.length - 1]}`;
}

/** Every day the farm is open at all, as one span for the hero strip. */
export function openDaysLine(): string {
  return formatDays(FARM.hours.flatMap((h) => [...h.days]));
}

export function establishedLine(): string {
  return `Established ${FARM.establishedYear}`;
}
