// Single source of truth for the brand's operational facts.
// PLACEHOLDERS are marked — swap them for the real values before launch.

export const site = {
  name: "Chautauqua County Courier",
  short: "CCC",
  spoken: "Triple-C",
  tagline: "One call. Consider it done.",
  descriptor: "Countywide delivery, errands & concierge runs — one guaranteed price before we go.",
  base: "Westfield, NY",
  // Live line (set 2026-07-29). Swap here if it changes down the road.
  phoneDigits: "7162240829",
  // PLACEHOLDER hours — confirm with owner.
  hours: [
    { days: "Mon – Sat", time: "8am – 8pm" },
    { days: "Sunday", time: "10am – 6pm" },
  ],
  domain: "chautauquacountycourier.com", // must be secured before printing
} as const;

/** (716) 555-0176 style. Falls back gracefully if the string isn't 10 digits. */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length !== 10) return digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function telHref(digits: string): string {
  return `tel:+1${digits.replace(/\D/g, "")}`;
}

export function smsHref(digits: string): string {
  return `sms:+1${digits.replace(/\D/g, "")}`;
}

// Real Chautauqua County towns — used for the coverage map and the "we cover" list.
// Westfield is the base (star on the map).
export const coverage = [
  "Westfield",
  "Mayville",
  "Chautauqua",
  "Bemus Point",
  "Jamestown",
  "Falconer",
  "Fredonia",
  "Dunkirk",
  "Sinclairville",
  "Cassadaga",
  "Brocton",
  "Ripley",
] as const;
